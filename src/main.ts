import {debounce, MarkdownPostProcessor, MarkdownPreviewRenderer, Plugin} from "obsidian";
import InlineReferenceExtension, {setPluginVariableForCM6EditorExtension} from "./cm-extensions/references-cm6";
import {buildLinksAndReferences, setPluginVariableForIndexer} from "./indexer";
import markdownPreviewProcessor from "./cm-extensions/references-preview";
import {SidePaneView, VIEW_TYPE_SNW} from "./ux/sidepane";
import setHeaderWithReferenceCounts, { setPluginVariableForHeaderRefCount } from "./ux/headerRefCount";
import {SettingsTab, Settings, DEFAULT_SETTINGS} from "./ux/settingsTab";
import SnwAPI from "./snwApi";
import ReferenceGutterExtension, { setPluginVariableForCM6Gutter } from "./cm-extensions/gutters";
import { setPluginVariableForHtmlDecorations } from "./cm-extensions/htmlDecorations";

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

    async onload(): Promise < void > {
        console.log("loading " + this.appName);

        const initializeEnvironment = async () => {
            await this.loadSettings();

            this.snwAPI = new SnwAPI(this);            
            // @ts-ignore
            globalThis.snwAPI = this.snwAPI;  // API access to SNW for Templater, Dataviewjs and the console debugger

            setPluginVariableForIndexer(this);
            setPluginVariableForCM6EditorExtension(this);
            setPluginVariableForHtmlDecorations(this);
            setPluginVariableForCM6Gutter(this);
            setPluginVariableForHeaderRefCount(this);

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
            
            this.app.workspace.on("layout-change", async () => {
                setHeaderWithReferenceCounts();
            });

            if(this.settings.displayInlineReferences ) {
                this.registerEditorExtension([InlineReferenceExtension]); // enable the codemirror extensions
                this.markdownPostProcessorSNW = this.registerMarkdownPostProcessor((el, ctx) => markdownPreviewProcessor(el, ctx, this));
            }

            if(this.settings.displayEmbedReferencesInGutter){
                this.registerEditorExtension(ReferenceGutterExtension);
            }

            const indexDebounce = debounce(() => {
                buildLinksAndReferences()
            }, 1000, true);
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

    async activateView(key : string, refType : string, link : string) {
        this.lastSelectedReferenceKey = key;
        this.lastSelectedReferenceType = refType;
        this.lastSelectedReferenceLink = link;
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_SNW);
        await this.app.workspace.getRightLeaf(false).setViewState({type: VIEW_TYPE_SNW, active: true});
        this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_SNW)[0]);
    }

    onunload(): void {
        console.log("unloading " + this.appName)
        try {
            this.app.workspace.detachLeavesOfType(VIEW_TYPE_SNW);
            MarkdownPreviewRenderer.unregisterPostProcessor(this.markdownPostProcessorSNW);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this.app.workspace as any).unregisterHoverLinkSource(this.appID);

        } catch (error) { /* don't do anything */ }
    }

    async loadSettings(): Promise<void> { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) }

	async saveSettings(): Promise<void> { await this.saveData(this.settings) }
}
