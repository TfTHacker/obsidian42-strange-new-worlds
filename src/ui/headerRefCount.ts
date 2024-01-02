// Displays in the header of open documents the count of incoming links

import { MarkdownView, Platform, WorkspaceLeaf } from 'obsidian';
import { Link } from '../types';
import SNWPlugin from '../main';
import { processHtmlDecorationReferenceEvent } from '../view-extensions/htmlDecorations';
import { getSnwAllLinksResolutions, getSNWCacheByFile } from '../indexer';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { getUIC_Hoverview } from './components/uic-ref--parent';

let thePlugin: SNWPlugin;

export function setPluginVariableForHeaderRefCount(plugin: SNWPlugin) {
  thePlugin = plugin;
}

/**
 * Iterates all open documents to see if they are markdown file, and if so called processHeader
 *
 * @export
 */
export default function setHeaderWithReferenceCounts() {
  if (thePlugin.snwAPI.enableDebugging?.LinkCountInHeader)
    thePlugin.snwAPI.console(
      'headerImageCount.setHeaderWithReferenceCounts(thePlugin)',
      SNWPlugin
    );

  thePlugin.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
    if (leaf.view.getViewType() === 'markdown') processHeader(leaf.view as MarkdownView);
  });
}

/**
 * Analyzes the page and if there is incoming links displays a header message
 *
 * @param {MarkdownView} mdView
 */
function processHeader(mdView: MarkdownView) {
  if (thePlugin.snwAPI.enableDebugging?.LinkCountInHeader)
    thePlugin.snwAPI.console(
      'headerImageCount.processHeader(ThePlugin, MarkdownView)',
      thePlugin,
      mdView
    );
  // TODO: should handle check for TFile better than non-null! assertion
  const mdViewFile = mdView.file!;

  const allLinks: Link[] = getSnwAllLinksResolutions();
  if (allLinks == undefined) return;

  const incomingLinks = allLinks.filter((f) => {
    if (!f?.resolvedFile) return false;
    return f?.resolvedFile?.path === mdViewFile.path;
  });

  let incomingLinksCount = incomingLinks.length;

  // check if the page is to be ignored
  const transformedCache = getSNWCacheByFile(mdViewFile);
  if (transformedCache?.cacheMetaData?.frontmatter?.['snw-file-exclude'] === true)
    incomingLinksCount = 0;

  // check if headers for this file are excluded
  if (incomingLinks[0]?.excludedFile === true) incomingLinksCount = 0;

  // if no incoming links, check if there is a header and remove it. In all cases, exit roturin
  if (incomingLinksCount < thePlugin.settings.minimumRefCountThreshold) {
    if (mdView.contentEl.querySelector('.snw-header-count-wrapper'))
      mdView.contentEl.querySelector('.snw-header-count-wrapper')?.remove();
    return;
  }

  let snwTitleRefCountDisplayCountEl: HTMLElement | null =
    mdView.contentEl.querySelector('.snw-header-count');

  // header count is already displayed, just update information.
  if (
    snwTitleRefCountDisplayCountEl &&
    snwTitleRefCountDisplayCountEl.getAttribute('data-snw-key') === mdViewFile.basename
  ) {
    snwTitleRefCountDisplayCountEl.innerText =
      ' ' + incomingLinks.length.toString() + ' ';
    return;
  }

  const containerViewContent: HTMLElement = mdView.contentEl;

  if (mdView.contentEl.querySelector('.snw-header-count-wrapper'))
    mdView.contentEl.querySelector('.snw-header-count-wrapper')?.remove();

  let wrapper: HTMLElement | null = containerViewContent.querySelector(
    '.snw-header-count-wrapper'
  );

  if (!wrapper) {
    wrapper = createDiv({ cls: 'snw-header-count-wrapper' });
    snwTitleRefCountDisplayCountEl = createDiv({ cls: 'snw-header-count' });
    wrapper.appendChild(snwTitleRefCountDisplayCountEl);
    containerViewContent.prepend(wrapper);
  } else {
    snwTitleRefCountDisplayCountEl =
      containerViewContent.querySelector('.snw-header-count');
  }

  if (snwTitleRefCountDisplayCountEl)
    snwTitleRefCountDisplayCountEl.innerText =
      ' ' + incomingLinks.length.toString() + ' ';
  if ((Platform.isDesktop || Platform.isDesktopApp) && snwTitleRefCountDisplayCountEl) {
    snwTitleRefCountDisplayCountEl.onclick = (e: MouseEvent) => {
      e.stopPropagation();
      if (wrapper) processHtmlDecorationReferenceEvent(wrapper);
    };
  }
  wrapper.setAttribute('data-snw-reallink', mdViewFile.basename);
  wrapper.setAttribute('data-snw-key', mdViewFile.basename);
  wrapper.setAttribute('data-snw-type', 'File');
  wrapper.setAttribute('data-snw-filepath', mdViewFile.path);
  wrapper.onclick = (e: MouseEvent) => {
    e.stopPropagation();
    processHtmlDecorationReferenceEvent(e.target as HTMLElement);
  };

  const requireModifierKey = thePlugin.settings.requireModifierKeyToActivateSNWView;
  // defaults to showing tippy on hover, but if requireModifierKey is true, then only show on ctrl/meta key
  let showTippy = true;
  const tippyObject = tippy(wrapper, {
    interactive: true,
    appendTo: () => document.body,
    allowHTML: true,
    zIndex: 9999,
    placement: 'auto-end',
    onTrigger(instance, event) {
      const mouseEvent = event as MouseEvent;
      if (requireModifierKey === false) return;
      if (mouseEvent.ctrlKey || mouseEvent.metaKey) {
        showTippy = true;
      } else {
        showTippy = false;
      }
    },
    onShow(instance) {
      // returning false will cancel the show (coming from onTrigger)
      if (!showTippy) return false;

      setTimeout(async () => {
        await getUIC_Hoverview(instance);
      }, 1);
    },
  });

  tippyObject.popper.classList.add('snw-tippy');

  if (thePlugin.snwAPI.enableDebugging?.LinkCountInHeader)
    thePlugin.snwAPI.console(
      'snwTitleRefCountDisplayCountEl',
      snwTitleRefCountDisplayCountEl
    );
}
