// Component creates an individual reference item

import { MarkdownRenderer } from 'obsidian';
import SNWPlugin from 'src/main';
import { Link } from '../../types';
import { ContextBuilder } from './context/context-builder';
import {
  formatHeadingBreadCrumbs,
  formatListBreadcrumbs,
  formatListWithDescendants,
} from './context/formatting-utils';
import { getTextAtPosition } from './context/position-utils';
import { render } from 'preact';

let thePlugin: SNWPlugin;

export function setPluginVariableUIC_RefItem(plugin: SNWPlugin) {
  thePlugin = plugin;
}

export const getUIC_Ref_Item = async (ref: Link): Promise<HTMLElement> => {
  const startLine =
    ref.reference.position !== undefined ?
      ref.reference.position.start.line.toString()
    : '0';

  const itemElJsx = (
    <div
      className="snw-ref-item-info search-result-file-match"
      snw-data-line-number={startLine}
      snw-data-file-name={ref?.sourceFile?.path.replace('.md', '')}
      data-href={ref?.sourceFile?.path.replace('.md', '')}
      dangerouslySetInnerHTML={{ __html: (await grabChunkOfFile(ref)).innerHTML }}
    />
  );

  const itemEl = createDiv();
  render(itemElJsx, itemEl);

  return itemEl;
};

/**
 * Grabs a block from a file, then runs it through a markdown render
 *
 * @param {Link} ref
 * @return {*}  {Promise<string>}
 */
const grabChunkOfFile = async (ref: Link): Promise<HTMLElement> => {
  const fileContents = await thePlugin.app.vault.cachedRead(ref.sourceFile);
  const fileCache = thePlugin.app.metadataCache.getFileCache(ref.sourceFile);
  const linkPosition = ref.reference.position;

  const container = createDiv();
  container.setAttribute('uic', 'uic'); //used to track if this is UIC element.

  const contextBuilder = new ContextBuilder(fileContents, fileCache);

  const headingBreadcrumbs = contextBuilder.getHeadingBreadcrumbs(linkPosition);
  if (headingBreadcrumbs.length > 0) {
    const headingBreadcrumbsEl = container.createDiv();
    headingBreadcrumbsEl.addClass('snw-breadcrumbs');

    headingBreadcrumbsEl.createEl('span', { text: 'H' });

    await MarkdownRenderer.renderMarkdown(
      formatHeadingBreadCrumbs(headingBreadcrumbs),
      headingBreadcrumbsEl,
      ref.sourceFile.path,
      thePlugin
    );
  }

  const indexOfListItemContainingLink =
    contextBuilder.getListItemIndexContaining(linkPosition);
  const isLinkInListItem = indexOfListItemContainingLink >= 0;

  if (isLinkInListItem) {
    const listBreadcrumbs = contextBuilder.getListBreadcrumbs(linkPosition);

    if (listBreadcrumbs.length > 0) {
      const contextEl = container.createDiv();
      contextEl.addClass('snw-breadcrumbs');

      contextEl.createEl('span', { text: 'L' });

      await MarkdownRenderer.render(
        thePlugin.app,
        formatListBreadcrumbs(fileContents, listBreadcrumbs),
        contextEl,
        ref.sourceFile.path,
        thePlugin
      );
    }

    const listItemWithDescendants = contextBuilder.getListItemWithDescendants(
      indexOfListItemContainingLink
    );

    const contextEl = container.createDiv();
    await MarkdownRenderer.render(
      thePlugin.app,
      formatListWithDescendants(fileContents, listItemWithDescendants),
      contextEl,
      ref.sourceFile.path,
      thePlugin
    );
  } else {
    const sectionContainingLink = contextBuilder.getSectionContaining(linkPosition);

    let blockContents = '';

    if (sectionContainingLink?.position !== undefined)
      blockContents = getTextAtPosition(fileContents, sectionContainingLink.position);

    await MarkdownRenderer.render(
      thePlugin.app,
      blockContents,
      container,
      ref.sourceFile.path,
      thePlugin
    );
  }

  const headingThatContainsLink = contextBuilder.getHeadingContaining(linkPosition);
  if (headingThatContainsLink) {
    const firstSectionPosition = contextBuilder.getFirstSectionUnder(
      headingThatContainsLink.position
    );
    if (firstSectionPosition) {
      const contextEl = container.createDiv();
      await MarkdownRenderer.render(
        thePlugin.app,
        getTextAtPosition(fileContents, firstSectionPosition.position),
        contextEl,
        ref.sourceFile.path,
        thePlugin
      );
    }
  }

  // add highlight to the link
  const elems = container.querySelectorAll('*');
  const res = Array.from(elems).find((v) => v.textContent == ref.reference.displayText);
  try {
    // this fails in some edge cases, so in that case, just ignore
    res.addClass('search-result-file-matched-text');
  } catch (error) {
    //@ts-ignore
  }

  return container;
};
