import { Extension } from '@codemirror/state';
import { CachedMetadata, debounce, MarkdownPostProcessor, MarkdownPreviewRenderer, Platform, Plugin, TFile } from 'obsidian';
import { buildLinksAndReferences, getLinkReferencesForFile, removeLinkReferencesForFile, setPluginVariableForIndexer } from './indexer';
import { InlineReferenceExtension, setPluginVariableForCM6InlineReferences } from './view-extensions/references-cm6';
import { setPluginVariableForHtmlDecorations } from './view-extensions/htmlDecorations';
import markdownPreviewProcessor, { setPluginVariableForMarkdownPreviewProcessor } from './view-extensions/references-preview';
import ReferenceGutterExtension, { setPluginVariableForCM6Gutter } from './view-extensions/gutters-cm6';
import setHeaderWithReferenceCounts, { setPluginVariableForHeaderRefCount } from './ui/headerRefCount';
import { SideBarPaneView, VIEW_TYPE_SNW } from './ui/sidebar-pane';
import { SettingsTab } from './ui/SettingsTab';
import { Settings, DEFAULT_SETTINGS } from './ui/settings';
import SnwAPI from './snwApi';
import { setPluginVariableForUIC } from './ui/components/uic-ref--parent';
import { setPluginVariableUIC_RefArea } from './ui/components/uic-ref-area';
import PluginCommands from './PluginCommands';

export default class SNWPlugin extends Plugin {
  appName = this.manifest.name;
  appID = this.manifest.id;
  APP_ABBREVIARTION = 'SNW';
  settings: Settings = DEFAULT_SETTINGS;
  //controls global state if the plugin is showing counters
  showCountsActive: boolean = DEFAULT_SETTINGS.enableOnStartupDesktop;
  lastSelectedReferenceType: string = '';
  lastSelectedReferenceRealLink: string = '';
  lastSelectedReferenceKey: string = '';
  lastSelectedReferenceFilePath: string = '';
  lastSelectedLineNumber: number = 0;
  snwAPI: SnwAPI = new SnwAPI(this);
  markdownPostProcessor: MarkdownPostProcessor | null = null;
  editorExtensions: Extension[] = [];
  commands: PluginCommands = new PluginCommands(this);

  async onload(): Promise<void> {
    console.log('loading ' + this.appName);

    setPluginVariableForIndexer(this);
    setPluginVariableUIC_RefArea(this);
    setPluginVariableForHtmlDecorations(this);
    setPluginVariableForCM6Gutter(this);
    setPluginVariableForHeaderRefCount(this);
    setPluginVariableForMarkdownPreviewProcessor(this);
    setPluginVariableForCM6InlineReferences(this);
    setPluginVariableForUIC(this);

    window.snwAPI = this.snwAPI; // API access to SNW for Templater, Dataviewjs and the console debugger

    await this.loadSettings();
    this.addSettingTab(new SettingsTab(this.app, this));

    // set current state based on startup parameters
    if (Platform.isMobile || Platform.isMobileApp) this.showCountsActive = this.settings.enableOnStartupMobile;
    else this.showCountsActive = this.settings.enableOnStartupDesktop;

    this.registerView(VIEW_TYPE_SNW, (leaf) => new SideBarPaneView(leaf, this));

    //Build the full index of the vault of references
    const indexFullUpdateDebounce = debounce(
      () => {
        buildLinksAndReferences();
      },
      5000,
      true
    );

    // Updates reference index for a single file by removing and re-adding the references
    const indexFileUpdateDebounce = debounce(
      async (file: TFile, data: string, cache: CachedMetadata) => {
        console.time(this.APP_ABBREVIARTION + ' update: ' + file.basename);
        await removeLinkReferencesForFile(file);
        getLinkReferencesForFile(file, cache);
        console.timeEnd(this.APP_ABBREVIARTION + ' update: ' + file.basename);
      },
      3000,
      true
    );

    this.registerEvent(this.app.vault.on('rename', indexFullUpdateDebounce));
    this.registerEvent(this.app.vault.on('delete', indexFullUpdateDebounce));
    this.registerEvent(this.app.metadataCache.on('changed', indexFileUpdateDebounce));

    this.app.workspace.registerHoverLinkSource(this.appID, {
      display: this.appName,
      defaultMod: true
    });

    this.snwAPI.settings = this.settings;

    this.registerEditorExtension(this.editorExtensions);

    this.toggleStateHeaderCount();
    this.toggleStateSNWMarkdownPreview();
    this.toggleStateSNWLivePreview();
    this.toggleStateSNWGutters();

    this.app.workspace.onLayoutReady(async () => {
      if (!this.app.workspace.getLeavesOfType(VIEW_TYPE_SNW)?.length) {
        await this.app.workspace.getRightLeaf(false).setViewState({ type: VIEW_TYPE_SNW, active: false });
      }
      const resolved = this.app.metadataCache.on('resolved', async () => {
        buildLinksAndReferences();
        this.app.metadataCache.offref(resolved);
      });
    });
  }

  async layoutChangeEvent() {
    setHeaderWithReferenceCounts();
  }

  // Displays the sidebar SNW pane
  async activateView(refType: string, realLink: string, key: string, filePath: string, lineNu: number) {
    this.lastSelectedReferenceType = refType;
    this.lastSelectedReferenceRealLink = realLink;
    this.lastSelectedReferenceKey = key;
    this.lastSelectedReferenceFilePath = filePath;
    this.lastSelectedLineNumber = lineNu;
    await (this.app.workspace.getLeavesOfType(VIEW_TYPE_SNW)[0].view as SideBarPaneView).updateView();
    this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_SNW)[0]);
  }

  // Turns on and off the reference count displayed at the top of the document in the header area
  toggleStateHeaderCount(): void {
    if (this.settings.displayIncomingFilesheader && this.showCountsActive) this.app.workspace.on('layout-change', this.layoutChangeEvent);
    else this.app.workspace.off('layout-change', this.layoutChangeEvent);
  }

  // Turns on and off the SNW reference counters in Reading mode
  toggleStateSNWMarkdownPreview(): void {
    if (this.settings.displayInlineReferencesMarkdown && this.showCountsActive && this.markdownPostProcessor === null) {
      this.markdownPostProcessor = this.registerMarkdownPostProcessor((el, ctx) => markdownPreviewProcessor(el, ctx));
    } else {
      if (!this.markdownPostProcessor) {
        console.log('Markdown post processor is not registered');
      } else {
        MarkdownPreviewRenderer.unregisterPostProcessor(this.markdownPostProcessor);
      }
      this.markdownPostProcessor = null;
    }
  }

  // Turns on and off the SNW reference counters in CM editor
  toggleStateSNWLivePreview(): void {
    let state = this.settings.displayInlineReferencesLivePreview;

    if (state === true) state = this.showCountsActive;

    this.updateCMExtensionState('inline-ref', state, InlineReferenceExtension);
  }

  // Turns on and off the SNW reference counters in CM editor gutter
  toggleStateSNWGutters(): void {
    let state =
      Platform.isMobile || Platform.isMobileApp ?
        this.settings.displayEmbedReferencesInGutterMobile
      : this.settings.displayEmbedReferencesInGutter;

    if (state === true) state = this.showCountsActive;

    this.updateCMExtensionState('gutter', state, ReferenceGutterExtension);
  }

  // Manages which CM extensions are loaded into Obsidian
  updateCMExtensionState(extensionIdentifier: string, extensionState: boolean, extension: Extension) {
    if (extensionState == true) {
      this.editorExtensions.push(extension);
      // @ts-ignore
      this.editorExtensions[this.editorExtensions.length - 1].snwID = extensionIdentifier;
    } else {
      for (let i = 0; i < this.editorExtensions.length; i++) {
        const ext = this.editorExtensions[i];
        // @ts-ignore
        if (ext.snwID === extensionIdentifier) {
          this.editorExtensions.splice(i, 1);
          break;
        }
      }
    }
    this.app.workspace.updateOptions();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  onunload(): void {
    console.log('unloading ' + this.appName);
    try {
      if (!this.markdownPostProcessor) {
        console.log('Markdown post processor is not registered');
      } else {
        MarkdownPreviewRenderer.unregisterPostProcessor(this.markdownPostProcessor);
      }
      this.app.workspace.unregisterHoverLinkSource(this.appID);
    } catch (error) {
      /* don't do anything */
    }
  }
}
