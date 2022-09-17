import {debounce, Plugin} from "obsidian";
import InlineReferenceExtension, {setPluginVariableForCM6} from "./cm-extensions/references-cm6";
import {buildLinksAndReferences} from "./indexer";
import markdownPreviewProcessor from "./cm-extensions/references-preview";
import {SidePaneView, VIEW_TYPE_SNW} from "./sidepane";
import setHeaderWithReferenceCounts from "./headerImageCount";
import {SettingsTab, Settings, DEFAULT_SETTINGS} from "./settingsTab";
import SnwAPI from "./snwApi";
import ReferenceGutterExtension from "./cm-extensions/gutters";
import { setPluginVariableForHtmlDecorations } from "./htmlDecorations";

export default class ThePlugin extends Plugin {
    pluginInitialized = false;
    appName = "Obsidian42 - Strange New Worlds";
    appID = "obsidian42-strange-new-worlds";
	settings: Settings;
    lastSelectedReferenceKey : string;
    lastSelectedReferenceType : string;
    lastSelectedReferenceLink : string;
    snwAPI: SnwAPI;

    async onload(): Promise < void > {
        console.log("loading " + this.appName);

        const indexDebounce = debounce(() => {
            buildLinksAndReferences(this.app)
        }, 3000, true);

        const initializeEnvironment = async () => {
            await this.loadSettings();

            this.snwAPI = new SnwAPI(this);            
            // @ts-ignore
            globalThis.snwAPI = this.snwAPI;  // API access to SNW for Templater, Dataviewjs and the console debugger

            setPluginVariableForCM6(this);
            setPluginVariableForHtmlDecorations(this);

            this.registerEditorExtension([InlineReferenceExtension]); // enable the codemirror extensions
            this.registerEditorExtension(ReferenceGutterExtension );
            this.registerEvent(this.app.metadataCache.on("resolve", (file) => indexDebounce()));
            this.registerMarkdownPostProcessor((el, ctx) => markdownPreviewProcessor(el, ctx, this));
            this.registerView(VIEW_TYPE_SNW, (leaf) => new SidePaneView(leaf, this));

            this.app.workspace.on("layout-change", async () => {
                setHeaderWithReferenceCounts(this);
            });

            this.addSettingTab(new SettingsTab(this.app, this));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this.app.workspace as any).registerHoverLinkSource(this.appID, {
                display: this.appName,
                defaultMod: true,
            });
            

            this.snwAPI.settings = this.settings

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
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_SNW);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.app.workspace as any).unregisterHoverLinkSource(this.appID);
        console.log("unloading " + this.appName)
    }

    async loadSettings(): Promise<void> { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) }

	async saveSettings(): Promise<void> { await this.saveData(this.settings) }
}
