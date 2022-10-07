import { Extension } from "@codemirror/state";
import {debounce, MarkdownPostProcessor, MarkdownPreviewRenderer, Plugin} from "obsidian";
import {buildLinksAndReferences, setPluginVariableForIndexer} from "./indexer";
import { InlineReferenceExtension, setPluginVariableForCM6InlineReferences } from "./cm-extensions/references-cm6";
import { setPluginVariableForHtmlDecorations } from "./cm-extensions/htmlDecorations";
import markdownPreviewProcessor, { setPluginVariableForMarkdownPreviewProcessor } from "./cm-extensions/references-preview";
import ReferenceGutterExtension, { setPluginVariableForCM6Gutter } from "./cm-extensions/gutters";
import setHeaderWithReferenceCounts, { setPluginVariableForHeaderRefCount } from "./ui/headerRefCount";
import { SideBarPaneView, VIEW_TYPE_SNW } from "./ui/side-pane";
import { SettingsTab, Settings, DEFAULT_SETTINGS} from "./ui/settingsTab";
import SnwAPI from "./snwApi";
import { setPluginVariableForUIC } from "./ui/components/uic-ref--parent";


export default class ThePlugin extends Plugin {
    appName = "Obsidian42 - Strange New Worlds"; 
    appID = "obsidian42-strange-new-worlds";  
	settings: Settings;
    lastSelectedReferenceType : string;
    lastSelectedReferenceKey : string; 
    lastSelectedReferenceFilePath : string;
    lastSelectedLineNumber: number;
    snwAPI: SnwAPI;
    markdownPostProcessorSNW: MarkdownPostProcessor = null;
    editorExtensions: Extension[] = [];
    sidebarPaneSNW: SideBarPaneView;
    environmentInitialized = false;
    
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

        // // initial build of references
        // buildLinksAndReferences();
        
        await this.loadSettings();
        this.addSettingTab(new SettingsTab(this.app, this));

        this.registerView(VIEW_TYPE_SNW, (leaf) => {
            this.sidebarPaneSNW = new SideBarPaneView(leaf, this)
            return this.sidebarPaneSNW;
        });



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
                this.app.metadataCache.trigger("snw:onlayoutready");
                setTimeout(()=>this.environmentInitialized=true, 5000); // Used to make everything is initialized.
            });
        });
    }

    async layoutChangeEvent() { 
        setHeaderWithReferenceCounts();
    }

    async activateView(refType: string, key: string, filePath: string, lineNu: number) {
        this.lastSelectedReferenceKey = key;
        this.lastSelectedReferenceType = refType;
        this.lastSelectedReferenceFilePath = filePath;
        this.lastSelectedLineNumber = lineNu;
        // this.app.workspace.detachLeavesOfType(VIEW_TYPE_SNW);
        // await this.app.workspace.getRightLeaf(false).setViewState({type: VIEW_TYPE_SNW, active: true});
        this.app.workspace.rightSplit.expand();
        await this.sidebarPaneSNW.updateView();
        setTimeout(() => {
            this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_SNW)[0]);
        }, 100);
    }

    toggleStateHeaderCount(): void {
        const state = this.settings.displayIncomingFilesheader;
        if(state===true)
            this.app.workspace.on("layout-change", this.layoutChangeEvent );
        else 
            this.app.workspace.off("layout-change", this.layoutChangeEvent );
    }

    toggleStateSNWMarkdownPreview(): void {
        const state = this.settings.displayInlineReferencesMarkdown;
        if(state==true && this.markdownPostProcessorSNW===null) {
            this.markdownPostProcessorSNW = this.registerMarkdownPostProcessor((el, ctx) => markdownPreviewProcessor(el, ctx));
        } else {
            MarkdownPreviewRenderer.unregisterPostProcessor(this.markdownPostProcessorSNW);
            this.markdownPostProcessorSNW=null;
        }
    }

    toggleStateSNWLivePreview(): void {
        this.updateCMExtensionState("inline-ref", this.settings.displayInlineReferencesLivePreview, InlineReferenceExtension);
    }

    toggleStateSNWGutters(): void {
        this.updateCMExtensionState("gutter", this.settings.displayEmbedReferencesInGutter, ReferenceGutterExtension);
    }

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
            // this.app.workspace.detachLeavesOfType(VIEW_TYPE_SNW);
            MarkdownPreviewRenderer.unregisterPostProcessor(this.markdownPostProcessorSNW);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this.app.workspace as any).unregisterHoverLinkSource(this.appID);

        } catch (error) { /* don't do anything */ }
    }

}
