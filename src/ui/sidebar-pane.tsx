// Sidepane used by SNW for displaying references

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { scrollResultsIntoView } from 'src/utils';
import { getReferencesCache } from '../indexer';
import SNWPlugin from '../main';
import { getUIC_SidePane } from './components/uic-ref--parent';
import { render } from 'preact';

export const VIEW_TYPE_SNW = 'Strange New Worlds';

export class SideBarPaneView extends ItemView {
  thePlugin: SNWPlugin;

  constructor(leaf: WorkspaceLeaf, thePlugin: SNWPlugin) {
    super(leaf);
    this.thePlugin = thePlugin;
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
        <div class="snw-sidepane-loading-subtext">
          Click a reference counter in the main document for information to appear here.
        </div>
      </div>,
      this.containerEl
    );
  }

  async updateView() {
    const refType = this.thePlugin.lastSelectedReferenceType;
    const realLink = this.thePlugin.lastSelectedReferenceRealLink;
    const key = this.thePlugin.lastSelectedReferenceKey;
    const filePath = this.thePlugin.lastSelectedReferenceFilePath;
    const lineNu = this.thePlugin.lastSelectedLineNumber;

    if (this.thePlugin.snwAPI.enableDebugging.SidePane) {
      this.thePlugin.snwAPI.console(
        'sidepane.open() refType, realLink, key, filePath',
        refType,
        realLink,
        key,
        filePath
      );
      this.thePlugin.snwAPI.console(
        'sidepane.open() getReferencesCache()',
        getReferencesCache()
      );
    }

    this.containerEl.replaceChildren(
      await getUIC_SidePane(refType, realLink, key, filePath, lineNu)
    );

    scrollResultsIntoView(this.containerEl);
  }

  async onClose() {
    // Nothing to clean up.
  }
}
