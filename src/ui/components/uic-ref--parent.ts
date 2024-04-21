import { Keymap, MarkdownView, Notice } from 'obsidian';
import SNWPlugin from 'src/main';
import { Instance, ReferenceElement } from 'tippy.js';
import { scrollResultsIntoView } from 'src/utils';
import { getUIC_Ref_Area } from './uic-ref-area';
import { setPluginVariableUIC_RefItem } from './uic-ref-item';

let plugin: SNWPlugin;

export function setPluginVariableForUIC(snwPlugin: SNWPlugin) {
  plugin = snwPlugin;
  setPluginVariableUIC_RefItem(plugin);
}

/**
 * Starting point for the hover popup control. Calls into uic-ref-area, then uic-ref-title and uic-ref-item
 *
 * @param {Instance} instance   the Tippy instance. Tippy provides the floating container.
 */
export const getUIC_Hoverview = async (instance: Instance) => {
  const { refType, realLink, key, filePath, lineNu } = await getDataElements(instance);
  const popoverEl = createDiv();
  popoverEl.addClass('snw-popover-container');
  popoverEl.addClass('search-result-container');
  popoverEl.appendChild(await getUIC_Ref_Area(refType, realLink, key, filePath, lineNu, true));
  instance.setContent(popoverEl);
  setTimeout(async () => {
    await setFileLinkHandlers(false, popoverEl);
  }, 500);
  scrollResultsIntoView(popoverEl);
};

// Loads the references into the side pane, using the same logic as the HoverView
export const getUIC_SidePane = async (
  refType: string,
  realLink: string,
  key: string,
  filePath: string,
  lineNu: number
): Promise<HTMLElement> => {
  const sidepaneEL = createDiv();
  sidepaneEL.addClass('snw-sidepane-container');
  sidepaneEL.addClass('search-result-container');
  sidepaneEL.append(await getUIC_Ref_Area(refType, realLink, key, filePath, lineNu, false));

  setTimeout(async () => {
    await setFileLinkHandlers(false, sidepaneEL);
  }, 500);

  return sidepaneEL;
};

// Creates event handlers for components of the HoverView and sidepane
export const setFileLinkHandlers = async (isHoverView: boolean, rootElementForViewEl: HTMLElement) => {
  const linksToFiles: NodeList = rootElementForViewEl.querySelectorAll(
    '.snw-ref-item-file, .snw-ref-item-info, .snw-ref-title-popover-label'
  );
  linksToFiles.forEach((node: Element) => {
    if (!node.getAttribute('snw-has-handler')) {
      node.setAttribute('snw-has-handler', 'true'); //prevent the event from being added twice
      // CLICK event
      node.addEventListener('click', async (e: MouseEvent) => {
        e.preventDefault();
        const handlerElement = (e.target as HTMLElement).closest('.snw-ref-item-file, .snw-ref-item-info, .snw-ref-title-popover-label');
        let lineNu = Number(handlerElement.getAttribute('snw-data-line-number'));
        const filePath = handlerElement.getAttribute('snw-data-file-name');
        const fileT = app.metadataCache.getFirstLinkpathDest(filePath, filePath);

        if (!fileT) {
          new Notice(`File not found: ${filePath}. It may be a broken link.`);
          return;
        }

        plugin.app.workspace.getLeaf(Keymap.isModEvent(e)).openFile(fileT);

        // for file titles, the embed handling for titles related to block id's and headers is hard to calculate, so its more efficient to do it here
        const titleKey = handlerElement.getAttribute('snw-ref-title-key');
        if (titleKey) {
          if (titleKey.contains('#^')) {
            // links to a block id
            const destinationBlocks = Object.entries(plugin.app.metadataCache.getFileCache(fileT)?.blocks);
            if (destinationBlocks) {
              const blockID = titleKey
                .match(/#\^(.+)$/g)[0]
                .replace('#^', '')
                .toLowerCase();
              const l = destinationBlocks.find((b) => b[0] === blockID);
              lineNu = l[1].position.start.line;
            }
          } else if (titleKey.contains('#')) {
            // possibly links to a header
            const destinationHeadings = plugin.app.metadataCache.getFileCache(fileT)?.headings;
            if (destinationHeadings) {
              const headingKey = titleKey.match(/#(.+)/g)[0].replace('#', '');
              const l = destinationHeadings.find((h) => h.heading === headingKey);
              lineNu = l.position.start.line;
            }
          }
        }

        if (lineNu > 0) {
          setTimeout(() => {
            // jumps to the line of the file where the reference is located
            try {
              plugin.app.workspace.getActiveViewOfType(MarkdownView).setEphemeralState({ line: lineNu });
            } catch (error) {
              /* Do nothing */
            }
          }, 400);
        }
      });
      // mouseover event
      // @ts-ignore
      if (plugin.app.internalPlugins.plugins['page-preview'].enabled === true) {
        node.addEventListener('mouseover', (e: PointerEvent) => {
          e.preventDefault();
          // @ts-ignore
          const hoverMetaKeyRequired =
            app.internalPlugins.plugins['page-preview'].instance.overrides['obsidian42-strange-new-worlds'] == false ? false : true;
          if (hoverMetaKeyRequired === false || (hoverMetaKeyRequired === true && Keymap.isModifier(e, 'Mod'))) {
            const target = e.target as HTMLElement;
            const previewLocation = {
              scroll: Number(target.getAttribute('snw-data-line-number'))
            };
            const filePath = target.getAttribute('snw-data-file-name');
            if (filePath) {
              // parameter signature for link-hover parent: HoverParent, targetEl: HTMLElement, linkText: string, sourcePath: string, eState: EphemeralState
              app.workspace.trigger('link-hover', {}, target, filePath, '', previewLocation);
            }
          }
        });
      }
    }
  });
};

// Utility function to extact key data points from the Tippy instance
const getDataElements = async (
  instance: Instance
): Promise<{
  refType: string;
  realLink: string;
  key: string;
  filePath: string;
  lineNu: number;
}> => {
  const parentElement: ReferenceElement = instance.reference;
  const refType = parentElement.getAttribute('data-snw-type');
  const realLink = parentElement.getAttribute('data-snw-reallink');
  const key = parentElement.getAttribute('data-snw-key');
  const path = parentElement.getAttribute('data-snw-filepath');
  const lineNum = Number(parentElement.getAttribute('snw-data-line-number'));
  return {
    refType: refType,
    realLink: realLink,
    key: key,
    filePath: path,
    lineNu: lineNum
  };
};
