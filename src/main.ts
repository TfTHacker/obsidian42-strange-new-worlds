import type { Extension } from "@codemirror/state";
import {
	type CachedMetadata,
	type MarkdownPostProcessor,
	MarkdownPreviewRenderer,
	Platform,
	Plugin,
	type TFile,
	type WorkspaceLeaf,
	debounce,
} from "obsidian";
import { buildLinksAndReferences, getLinkReferencesForFile, removeLinkReferencesForFile, setPluginVariableForIndexer } from "./indexer";
import { DEFAULT_SETTINGS, type Settings } from "./settings";
import SnwAPI from "./snwApi";
import PluginCommands from "./ui/PluginCommands";
import { SettingsTab } from "./ui/SettingsTab";
import { SideBarPaneView, VIEW_TYPE_SNW } from "./ui/SideBarPaneView";
import { setPluginVariableForUIC } from "./ui/components/uic-ref--parent";
import { setPluginVariableUIC_RefArea } from "./ui/components/uic-ref-area";
import { setPluginVariableForFrontmatterLinksRefCount, updatePropertiesDebounce } from "./ui/frontmatterRefCount";
import { setPluginVariableForHeaderRefCount, updateHeadersDebounce } from "./ui/headerRefCount";
import ReferenceGutterExtension, { setPluginVariableForCM6Gutter } from "./view-extensions/gutters-cm6";
import { setPluginVariableForHtmlDecorations, updateAllSnwLiveUpdateReferencesDebounce } from "./view-extensions/htmlDecorations";
import { InlineReferenceExtension, setPluginVariableForCM6InlineReferences } from "./view-extensions/references-cm6";
import markdownPreviewProcessor, { setPluginVariableForMarkdownPreviewProcessor } from "./view-extensions/references-preview";

export const UPDATE_DEBOUNCE = 200;

export default class SNWPlugin extends Plugin {
	appName = this.manifest.name;
	appID = this.manifest.id;
	APP_ABBREVIARTION = "SNW";
	settings: Settings = DEFAULT_SETTINGS;
	//controls global state if the plugin is showing counters
	showCountsActive: boolean = DEFAULT_SETTINGS.enableOnStartupDesktop;
	lastSelectedReferenceType = "";
	lastSelectedReferenceRealLink = "";
	lastSelectedReferenceKey = "";
	lastSelectedReferenceFilePath = "";
	lastSelectedLineNumber = 0;
	snwAPI: SnwAPI = new SnwAPI(this);
	markdownPostProcessor: MarkdownPostProcessor | null = null;
	editorExtensions: Extension[] = [];
	commands: PluginCommands = new PluginCommands(this);

	async onload(): Promise<void> {
		console.log(`loading ${this.appName}`);

		setPluginVariableForIndexer(this);
		setPluginVariableUIC_RefArea(this);
		setPluginVariableForHtmlDecorations(this);
		setPluginVariableForCM6Gutter(this);
		setPluginVariableForHeaderRefCount(this);
		setPluginVariableForFrontmatterLinksRefCount(this);
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
				updateHeadersDebounce();
				updatePropertiesDebounce();
				updateAllSnwLiveUpdateReferencesDebounce();
			},
			3000,
			true,
		);

		// Updates reference index for a single file by removing and re-adding the references
		const indexFileUpdateDebounce = debounce(
			async (file: TFile, data: string, cache: CachedMetadata) => {
				await removeLinkReferencesForFile(file);
				getLinkReferencesForFile(file, cache);
				updateHeadersDebounce();
				updatePropertiesDebounce();
				updateAllSnwLiveUpdateReferencesDebounce();
			},
			1000,
			true,
		);

		this.registerEvent(this.app.vault.on("rename", indexFullUpdateDebounce));
		this.registerEvent(this.app.vault.on("delete", indexFullUpdateDebounce));
		this.registerEvent(this.app.metadataCache.on("changed", indexFileUpdateDebounce));

		this.app.workspace.registerHoverLinkSource(this.appID, {
			display: this.appName,
			defaultMod: true,
		});

		this.snwAPI.settings = this.settings;

		this.registerEditorExtension(this.editorExtensions);

		this.app.workspace.on("layout-change", () => {
			updateHeadersDebounce();
			updatePropertiesDebounce();
		});

		this.toggleStateSNWMarkdownPreview();
		this.toggleStateSNWLivePreview();
		this.toggleStateSNWGutters();

		this.app.workspace.onLayoutReady(async () => {
			if (!this.app.workspace.getLeavesOfType(VIEW_TYPE_SNW)?.length) {
				await this.app.workspace.getRightLeaf(false)?.setViewState({ type: VIEW_TYPE_SNW, active: false });
			}
			buildLinksAndReferences();
		});
	}

	// Displays the sidebar SNW pane
	async activateView(refType: string, realLink: string, key: string, filePath: string, lineNu: number) {
		this.lastSelectedReferenceType = refType;
		this.lastSelectedReferenceRealLink = realLink;
		this.lastSelectedReferenceKey = key;
		this.lastSelectedReferenceFilePath = filePath;
		this.lastSelectedLineNumber = lineNu;

		const { workspace } = this.app;
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_SNW);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			const leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: VIEW_TYPE_SNW, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		if (leaf) workspace.revealLeaf(leaf);
		await (this.app.workspace.getLeavesOfType(VIEW_TYPE_SNW)[0].view as SideBarPaneView).updateView();
	}

	// Turns on and off the SNW reference counters in Reading mode
	toggleStateSNWMarkdownPreview(): void {
		if (this.settings.displayInlineReferencesMarkdown && this.showCountsActive && this.markdownPostProcessor === null) {
			this.markdownPostProcessor = this.registerMarkdownPostProcessor((el, ctx) => markdownPreviewProcessor(el, ctx), 100);
		} else {
			if (!this.markdownPostProcessor) {
				console.log("Markdown post processor is not registered");
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

		this.updateCMExtensionState("inline-ref", state, InlineReferenceExtension);
	}

	// Turns on and off the SNW reference counters in CM editor gutter
	toggleStateSNWGutters(): void {
		let state =
			Platform.isMobile || Platform.isMobileApp
				? this.settings.displayEmbedReferencesInGutterMobile
				: this.settings.displayEmbedReferencesInGutter;

		if (state === true) state = this.showCountsActive;

		this.updateCMExtensionState("gutter", state, ReferenceGutterExtension);
	}

	// Manages which CM extensions are loaded into Obsidian
	updateCMExtensionState(extensionIdentifier: string, extensionState: boolean, extension: Extension) {
		if (extensionState === true) {
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
		console.log(`unloading ${this.appName}`);
		try {
			if (!this.markdownPostProcessor) {
				console.log("Markdown post processor is not registered");
			} else {
				MarkdownPreviewRenderer.unregisterPostProcessor(this.markdownPostProcessor);
			}
			this.app.workspace.unregisterHoverLinkSource(this.appID);
		} catch (error) {
			/* don't do anything */
		}
	}
}
