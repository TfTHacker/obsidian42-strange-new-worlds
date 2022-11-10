import { Extension } from "@codemirror/state";
import { debounce, MarkdownPostProcessor, MarkdownPreviewRenderer, Platform, Plugin } from "obsidian";
import { buildLinksAndReferences, setPluginVariableForIndexer } from "./indexer";
import { InlineReferenceExtension, setPluginVariableForCM6InlineReferences } from "./view-extensions/references-cm6";
import { setPluginVariableForHtmlDecorations } from "./view-extensions/htmlDecorations";
import markdownPreviewProcessor, { setPluginVariableForMarkdownPreviewProcessor } from "./view-extensions/references-preview";
import ReferenceGutterExtension, { setPluginVariableForCM6Gutter } from "./view-extensions/gutters-cm6";
import setHeaderWithReferenceCounts, { setPluginVariableForHeaderRefCount } from "./ui/headerRefCount";
import { SideBarPaneView, VIEW_TYPE_SNW } from "./ui/sidebar-pane";
import { SettingsTab, Settings, DEFAULT_SETTINGS} from "./ui/settingsTab";
import SnwAPI from "./snwApi";
import { setPluginVariableForUIC } from "./ui/components/uic-ref--parent";
import PluginCommands from "./pluginCommands";


export default class ThePlugin extends Plugin {
    appName =  this.manifest.name; 
    appID = this.manifest.id;  
	settings: Settings;
    snwPluginActivelyShowingCounts: boolean;  //controls global state if the plugin is showing counters 
    lastSelectedReferenceType : string;
    lastSelectedReferenceKey : string; 
    lastSelectedReferenceFilePath : string;
    lastSelectedLineNumber: number;
    snwAPI: SnwAPI;
    markdownPostProcessorSNW: MarkdownPostProcessor = null;
    editorExtensions: Extension[] = [];
    commands: PluginCommands;

    
    async onload(): Promise < void > {
        console.log("loading " + this.appName);

        setPluginVariableForIndexer(this);
        setPluginVariableForHtmlDecorations(this);
        setPluginVariableForCM6Gutter(this);
        setPluginVariableForHeaderRefCount(this);
        setPluginVariableForMarkdownPreviewProcessor(this);
        setPluginVariableForCM6InlineReferences(this);
        setPluginVariableForUIC(this);

        this.snwAPI = new SnwAPI(this);            
        // @ts-ignore
        globalThis.snwAPI = this.snwAPI;  // API access to SNW for Templater, Dataviewjs and the console debugger

        await this.loadSettings();
        this.addSettingTab(new SettingsTab(this.app, this));

        // set current state based on startup parameters
        if((Platform.isMobile||Platform.isMobileApp))
            this.snwPluginActivelyShowingCounts = this.settings.enableOnStartupMobile;
        else
            this.snwPluginActivelyShowingCounts = this.settings.enableOnStartupDesktop;

        this.commands = new PluginCommands(this);

        this.registerView(VIEW_TYPE_SNW, (leaf) => new SideBarPaneView(leaf, this));

        //initial index building
        const indexDebounce = debounce(() => {
            buildLinksAndReferences()
        }, 1000, true);

        this.registerEvent(this.app.metadataCache.on("resolve", (file) => indexDebounce()));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.app.workspace as any).registerHoverLinkSource(this.appID, {
            display: this.appName,
            defaultMod: true,
        });

        this.snwAPI.settings = this.settings;

        this.registerEditorExtension(this.editorExtensions);
        
        this.toggleStateHeaderCount();
        this.toggleStateSNWMarkdownPreview();
        this.toggleStateSNWLivePreview();
        this.toggleStateSNWGutters();

        this.app.workspace.onLayoutReady( async () => {
            const resolved = this.app.metadataCache.on("resolved", async () => {
                buildLinksAndReferences();
                this.app.metadataCache.offref(resolved);
                if( !this.app.workspace.getLeavesOfType(VIEW_TYPE_SNW)?.length ) {
                    await this.app.workspace.getRightLeaf(false).setViewState({type: VIEW_TYPE_SNW, active: false});
                }
            });
        });
    }

    async layoutChangeEvent() { 
        setHeaderWithReferenceCounts();
    }

    /**
     * Displays the sidebar SNW pane
     *
     * @param {string} refType
     * @param {string} key
     * @param {string} filePath
     * @param {number} lineNu
     * @memberof ThePlugin
     */
    async activateView(refType: string, key: string, filePath: string, lineNu: number) {
        this.lastSelectedReferenceKey = key;
        this.lastSelectedReferenceType = refType;
        this.lastSelectedReferenceFilePath = filePath;
        this.lastSelectedLineNumber = lineNu;
        this.app.workspace.rightSplit.expand();

        await (this.app.workspace.getLeavesOfType(VIEW_TYPE_SNW)[0].view as SideBarPaneView).updateView();

        setTimeout(() => {
            this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_SNW)[0]);
        }, 100);
    }

    /**
     * Turns on and off the reference count displayed at the top of the document in the header area
     *
     * @memberof ThePlugin
     */
    toggleStateHeaderCount(): void {
        let state = this.settings.displayIncomingFilesheader;

        if(state===true) 
            state = this.snwPluginActivelyShowingCounts;

        if(state===true)
            this.app.workspace.on("layout-change", this.layoutChangeEvent );
        else 
            this.app.workspace.off("layout-change", this.layoutChangeEvent );
    }

    /**
     * Turns on and off the SNW reference counters in Reading mode
     *
     * @memberof ThePlugin
     */
    toggleStateSNWMarkdownPreview(): void {
        let state = this.settings.displayInlineReferencesMarkdown;

        if(state===true) 
            state = this.snwPluginActivelyShowingCounts;

        if(state==true && this.markdownPostProcessorSNW===null) {
            this.markdownPostProcessorSNW = this.registerMarkdownPostProcessor((el, ctx) => markdownPreviewProcessor(el, ctx));
        } else {
            MarkdownPreviewRenderer.unregisterPostProcessor(this.markdownPostProcessorSNW);
            this.markdownPostProcessorSNW=null;
        }
    }

    /**
     * Turns on and off the SNW reference counters in CM editor
     *
     * @memberof ThePlugin
     */
    toggleStateSNWLivePreview(): void {
        let state = this.settings.displayInlineReferencesLivePreview;

        if(state===true) 
            state = this.snwPluginActivelyShowingCounts;

        this.updateCMExtensionState("inline-ref", state, InlineReferenceExtension);
    }

    /**
     * Turns on and off the SNW reference counters in CM editor gutter
     *
     * @memberof ThePlugin
     */
    toggleStateSNWGutters(): void {
        let state = (Platform.isMobile || Platform.isMobileApp) ? 
                    this.settings.displayEmbedReferencesInGutterMobile : 
                    this.settings.displayEmbedReferencesInGutter;
                    
        if(state===true) 
            state = this.snwPluginActivelyShowingCounts;

        this.updateCMExtensionState("gutter", state, ReferenceGutterExtension);
    }

    /**
     * Manages which CM extensions are loaded into Obsidian
     *
     * @param {string} extensionIdentifier
     * @param {boolean} extensionState
     * @param {Extension} extension
     * @memberof ThePlugin
     */
    updateCMExtensionState(extensionIdentifier: string, extensionState: boolean, extension: Extension ) {
        if(extensionState==true) {
            this.editorExtensions.push(extension);
            // @ts-ignore
            this.editorExtensions[this.editorExtensions.length-1].snwID = extensionIdentifier;
        } else {
            for (let i = 0; i < this.editorExtensions.length; i++) {
                const ext = this.editorExtensions[i];
                // @ts-ignore
                if(ext.snwID === extensionIdentifier) {
                    this.editorExtensions.splice(i,1);
                    break;
                }
            }
        }
        this.app.workspace.updateOptions();
    }

    async loadSettings(): Promise<void> { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) }

	async saveSettings(): Promise<void> { await this.saveData(this.settings) }

    onunload(): void {
        console.log("unloading " + this.appName)
        try {
            MarkdownPreviewRenderer.unregisterPostProcessor(this.markdownPostProcessorSNW);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this.app.workspace as any).unregisterHoverLinkSource(this.appID);
        } catch (error) { /* don't do anything */ }
    }

}
