import { MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownSectionInformation, TFile, stripHeading } from 'obsidian';
import { htmlDecorationForReferencesElement } from './htmlDecorations';
import { getSNWCacheByFile, parseLinkTextToFullPath } from '../indexer';
import SNWPlugin from '../main';

let plugin: SNWPlugin;

export function setPluginVariableForMarkdownPreviewProcessor(snwPlugin: SNWPlugin) {
  plugin = snwPlugin;
}

/**
 * Function called by main.registerMarkdownPostProcessor - this function renders the html when in preview mode
 * This function receives a section of the document for processsing. So this function is called many times for a document.
 */
export default function markdownPreviewProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
  // @ts-ignore
  if (ctx.remainingNestLevel === 4) return; // This is an attempt to prevent processing of embed files

  if (el.hasAttribute('uic')) return; // this is a custom component, don't render SNW inside it.

  // The following line addresses a conflict with the popular Tasks plugin.
  if (el.querySelectorAll('.contains-task-list').length > 0) return;

  const currentFile = plugin.app.vault.fileMap[ctx.sourcePath];
  if (currentFile === undefined) return;

  // check for incompatibility with other plugins
  const fileCache = plugin.app.metadataCache.getFileCache(currentFile);
  // @ts-ignore
  if (fileCache?.frontmatter?.['kanban-plugin'] || ctx.el.parentElement?.classList.contains('kanban-plugin__markdown-preview-view')) return; //no support for kanban board

  try {
    ctx.addChild(new snwChildComponent(el, ctx.getSectionInfo(el), currentFile));
  } catch (error) {
    // for now just fail - no logging
  }
}

class snwChildComponent extends MarkdownRenderChild {
  containerEl: HTMLElement;
  sectionInfo: MarkdownSectionInformation;
  currentFile: TFile;

  constructor(containerEl: HTMLElement, sectionInfo: MarkdownSectionInformation, currentFile: TFile) {
    super(containerEl);
    this.containerEl = containerEl;
    this.sectionInfo = sectionInfo;
    this.currentFile = currentFile;
  }

  onload(): void {
    this.processMarkdown();
  }

  processMarkdown(): void {
    const minRefCountThreshold = plugin.settings.minimumRefCountThreshold;
    const transformedCache = getSNWCacheByFile(this.currentFile);

    if (transformedCache?.cacheMetaData?.frontmatter?.['snw-file-exclude'] === true) return;
    if (transformedCache?.cacheMetaData?.frontmatter?.['snw-canvas-exclude-preview'] === true) return;

    if (transformedCache?.blocks || transformedCache.embeds || transformedCache.headings || transformedCache.links) {
      if (plugin.settings.enableRenderingBlockIdInMarkdown && transformedCache?.blocks) {
        let isThisAnEmbed = false; //Testing to see if this check is still needed
        // try {
        // we don't want to proccess embeds
        // @ts-ignore
        // isThisAnEmbed = ctx.containerEl.closest('.snw-embed-preview').nextSibling.classList.contains('snw-reference');
        // } catch (error) {
        /* nothing to do here */
        // }

        for (const value of transformedCache.blocks) {
          if (
            value.references.length >= minRefCountThreshold &&
            value.pos.start.line >= this.sectionInfo?.lineStart &&
            value.pos.end.line <= this.sectionInfo?.lineEnd &&
            !isThisAnEmbed
          ) {
            const referenceElement = htmlDecorationForReferencesElement(
              value.references.length,
              'block',
              value.references[0].realLink,
              value.key,
              value.references[0]?.resolvedFile?.path.replace('.' + value.references[0]?.resolvedFile?.path, ''),
              '',
              value.pos.start.line
            );
            let blockElement: HTMLElement = this.containerEl.querySelector('p');
            const valueLineInSection: number = value.pos.start.line - this.sectionInfo.lineStart;
            if (!blockElement) {
              blockElement = this.containerEl.querySelector(`li[data-line="${valueLineInSection}"]`);
              if (blockElement.querySelector('ul')) blockElement.querySelector('ul').before(referenceElement);
              else blockElement.append(referenceElement);
            } else {
              if (!blockElement) {
                blockElement = this.containerEl.querySelector(`ol[data-line="${valueLineInSection}"]`);
                blockElement.append(referenceElement);
              } else {
                blockElement.append(referenceElement);
              }
            }
            try {
              if (!blockElement.hasClass('snw-block-preview')) {
                referenceElement.addClass('snw-block-preview');
              }
            } catch (error) {
              /* nothing to do here */
            }
          }
        }
      }

      if (plugin.settings.enableRenderingEmbedsInMarkdown && transformedCache?.embeds) {
        this.containerEl.querySelectorAll('.internal-embed:not(.snw-embed-preview)').forEach((element) => {
          let embedKey = parseLinkTextToFullPath(element.getAttribute('src'));
          if (embedKey === '') {
            embedKey = this.currentFile.path.replace('.' + this.currentFile.extension, '') + stripHeading(element.getAttribute('src'));
          }
          for (const value of transformedCache.embeds) {
            if (value.references.length >= minRefCountThreshold && embedKey.endsWith(value.key)) {
              const referenceElement = htmlDecorationForReferencesElement(
                value.references.length,
                'embed',
                value.references[0].realLink,
                value.key,
                value.references[0]?.resolvedFile?.path.replace('.' + value.references[0]?.resolvedFile?.extension, ''),
                '',
                value.pos.start.line
              );
              referenceElement.addClass('snw-embed-preview');
              element.after(referenceElement);
              break;
            }
          }
        });
      }

      if (plugin.settings.enableRenderingHeadersInMarkdown) {
        const headerKey = this.containerEl.querySelector('[data-heading]');
        if (transformedCache?.headings && headerKey) {
          const textContext = headerKey.getAttribute('data-heading');
          for (const value of transformedCache.headings) {
            if (value.references.length >= minRefCountThreshold && value.headerMatch === textContext!.replace(/\[|\]/g, '')) {
              const referenceElement = htmlDecorationForReferencesElement(
                value.references.length,
                'heading',
                value.references[0].realLink,
                value.key,
                value.references[0]?.resolvedFile?.path.replace('.' + value.references[0]?.resolvedFile?.extension, ''),
                '',
                value.pos.start.line
              );
              referenceElement.addClass('snw-heading-preview');
              this.containerEl.querySelector('h1,h2,h3,h4,h5,h6').insertAdjacentElement('beforeend', referenceElement);
              break;
            }
          }
        }
      }

      if (plugin.settings.enableRenderingLinksInMarkdown && transformedCache?.links) {
        this.containerEl.querySelectorAll('a.internal-link').forEach((element) => {
          const link = parseLinkTextToFullPath(element.getAttribute('data-href'));
          for (const value of transformedCache.links) {
            if (
              value.references.length >= minRefCountThreshold &&
              (value.key === link || (value?.original != undefined && value?.original.contains(link)))
            ) {
              const referenceElement = htmlDecorationForReferencesElement(
                value.references.length,
                'link',
                value.references[0].realLink,
                value.key,
                value.references[0]?.resolvedFile?.path.replace('.' + value.references[0]?.resolvedFile?.extension, ''),
                '',
                value.pos.start.line
              );
              referenceElement.addClass('snw-link-preview');
              element.after(referenceElement);
              break;
            }
          }
        });
      }
    }
  }
}
