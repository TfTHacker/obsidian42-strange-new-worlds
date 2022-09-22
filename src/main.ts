import { Extension } from "@codemirror/state";
import {debounce, MarkdownPostProcessor, MarkdownPreviewRenderer, Plugin} from "obsidian";
import {buildLinksAndReferences, setPluginVariableForIndexer} from "./indexer";
import { InlineReferenceExtension } from "./cm-extensions/references-cm6";
import { setPluginVariableForHtmlDecorations } from "./cm-extensions/htmlDecorations";
import markdownPreviewProcessor, { setPluginVariableForMarkdownPreviewProcessor } from "./cm-extensions/references-preview";
import ReferenceGutterExtension, { setPluginVariableForCM6Gutter } from "./cm-extensions/gutters";
import setHeaderWithReferenceCounts, { setPluginVariableForHeaderRefCount } from "./ux/headerRefCount";
import { SidePaneView, VIEW_TYPE_SNW } from "./ux/sidepane";
import { SettingsTab, Settings, DEFAULT_SETTINGS} from "./ux/settingsTab";
import SnwAPI from "./snwApi";

export default class ThePlugin extends Plugin {
    pluginInitialized = false;
    appName = "Obsidian42 - Strange New Worlds";
    appID = "obsidian42-strange-new-worlds";
	settings: Settings;
    lastSelectedReferenceKey : string;
    lastSelectedReferenceType : string;
    lastSelectedReferenceLink : string;
    snwAPI: SnwAPI;
    markdownPostProcessorSNW: MarkdownPostProcessor = null;
    editorExtensions: Extension[] = [];
    
    async onload(): Promise < void > {
        console.log("loading " + this.appName);

        const initializeEnvironment = async () => {
            await this.loadSettings();


            this.snwAPI = new SnwAPI(this);            
            // @ts-ignore
            globalThis.snwAPI = this.snwAPI;  // API access to SNW for Templater, Dataviewjs and the console debugger

            setPluginVariableForIndexer(this);
            setPluginVariableForHtmlDecorations(this);
            setPluginVariableForCM6Gutter(this);
            setPluginVariableForHeaderRefCount(this);
            setPluginVariableForMarkdownPreviewProcessor(this);

            this.addSettingTab(new SettingsTab(this.app, this));

            //initial index building
            this.registerEvent(this.app.metadataCache.on("resolve", (file) => indexDebounce()));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this.app.workspace as any).registerHoverLinkSource(this.appID, {
                display: this.appName,
                defaultMod: true,
            });

            this.snwAPI.settings = this.settings;

            this.registerView(VIEW_TYPE_SNW, (leaf) => new SidePaneView(leaf, this));

            this.registerEditorExtension(this.editorExtensions);
            
            this.toggleStateHeaderCount();
            this.toggleStateSNWMarkdownPreview();
            this.toggleStateSNWLivePreview();
            this.toggleStateSNWGutters();

            const indexDebounce = debounce(() => {
                buildLinksAndReferences()
            }, 1000, true);

            // initial build of references
            buildLinksAndReferences();
        }

        // managing state for debugging purpsoes
        setTimeout(async () => {
            if (!this.pluginInitialized) {
                this.pluginInitialized = true;
                await initializeEnvironment();
            }
        }, 4000);

        this.app.workspace.onLayoutReady(() => {
            const resolved = this.app.metadataCache.on("resolved", () => {
                this.app.metadataCache.offref(resolved);
                if (!this.pluginInitialized) {
                    this.pluginInitialized = true;
                    initializeEnvironment();
                }
            });
        });
    }

    async layoutChangeEvent() { 
        setHeaderWithReferenceCounts();
    }

    async activateView(key : string, refType : string, link : string) {
        this.lastSelectedReferenceKey = key;
        this.lastSelectedReferenceType = refType;
        this.lastSelectedReferenceLink = link;
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_SNW);
        await this.app.workspace.getRightLeaf(false).setViewState({type: VIEW_TYPE_SNW, active: true});
        this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_SNW)[0]);
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
            this.markdownPostProcessorSNW = this.markdownPostProcessorSNW = this.registerMarkdownPostProcessor((el, ctx) => markdownPreviewProcessor(el, ctx));
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
            this.app.workspace.detachLeavesOfType(VIEW_TYPE_SNW);
            MarkdownPreviewRenderer.unregisterPostProcessor(this.markdownPostProcessorSNW);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this.app.workspace as any).unregisterHoverLinkSource(this.appID);

        } catch (error) { /* don't do anything */ }
    }

}
