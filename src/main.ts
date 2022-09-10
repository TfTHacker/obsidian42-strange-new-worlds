import {debounce, Plugin} from "obsidian";
import InlineReferenceExtension, {setPluginVariableForCM6} from "./references-cm6";
import {buildLinksAndReferences} from "./indexer";
import markdownPreviewProcessor from "./references-preview";
import {SidePaneView, VIEW_TYPE_SNW} from "./sidepane";
import setHeaderWithReferenceCounts from "./headerImageCount";
import {SettingsTab, Settings, DEFAULT_SETTINGS} from "./settingsTab";
import SnwAPI from "./snwApi";

export default class ThePlugin extends Plugin {
    pluginInitialized = false;
    appName = "Obsidian42 - Strange New Worlds";
    appID = "obsidian42-strange-new-worlds";
	settings: Settings;
    lastSelectedReferenceKey : string;
    lastSelectedReferenceType : string;
    lastSelectedReferenceLink : string;

    async onload(): Promise < void > {
        console.log("loading " + this.appName);

        const indexDebounce = debounce(() => {
            buildLinksAndReferences(this.app)
        }, 3000, true);

        const initializeEnvironment = async () => {
            await this.loadSettings();
            setPluginVariableForCM6(this);

            this.registerEditorExtension([InlineReferenceExtension]); // enable the codemirror extensions
            this.registerEvent(this.app.metadataCache.on("resolve", (file) => indexDebounce()));
            this.registerMarkdownPostProcessor((el, ctx) => markdownPreviewProcessor(el, ctx, this));
            this.registerView(VIEW_TYPE_SNW, (leaf) => new SidePaneView(leaf, this));

            this.app.workspace.on("layout-change", async () => {
                setHeaderWithReferenceCounts(this);
            });

            this.addSettingTab(new SettingsTab(this.app, this));
            
            //@ts-ignore
            globalThis.snwAPI = new SnwAPI(this);

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
        console.log("unloading " + this.appName)
    }

    async loadSettings(): Promise<void> { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) }

	async saveSettings(): Promise<void> { await this.saveData(this.settings) }
}
