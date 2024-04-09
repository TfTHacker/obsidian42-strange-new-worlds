// Sidepane used by SNW for displaying references

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { scrollResultsIntoView } from 'src/utils';
import SNWPlugin from '../main';
import { getUIC_SidePane } from './components/uic-ref--parent';
import { render } from 'preact';

export const VIEW_TYPE_SNW = 'Strange New Worlds';

export class SideBarPaneView extends ItemView {
  plugin: SNWPlugin;

  constructor(leaf: WorkspaceLeaf, snnwPlugin: SNWPlugin) {
    super(leaf);
    this.plugin = snnwPlugin;
  }

  getViewType() {
    return VIEW_TYPE_SNW;
  }

  getDisplayText() {
    return VIEW_TYPE_SNW;
  }

  getIcon() {
    return 'file-digit';
  }

  async onOpen() {
    render(
      <div class="snw-sidepane-loading">
        <div class="snw-sidepane-loading-banner">Discovering Strange New Worlds...</div>
        <div class="snw-sidepane-loading-subtext">Click a reference counter in the main document for information to appear here.</div>
      </div>,
      this.containerEl
    );
  }

  async updateView() {
    const refType = this.plugin.lastSelectedReferenceType;
    const realLink = this.plugin.lastSelectedReferenceRealLink;
    const key = this.plugin.lastSelectedReferenceKey;
    const filePath = this.plugin.lastSelectedReferenceFilePath;
    const lineNu = this.plugin.lastSelectedLineNumber;

    this.containerEl.replaceChildren(await getUIC_SidePane(refType, realLink, key, filePath, lineNu));

    scrollResultsIntoView(this.containerEl);
  }

  async onClose() {
    // Nothing to clean up.
  }
}
