// Sidepane used by SNW for displaying references

import { ItemView, type WorkspaceLeaf } from "obsidian";
import { render } from "preact";
import { scrollResultsIntoView } from "src/utils";
import type SNWPlugin from "../main";
import { getUIC_SidePane } from "./components/uic-ref--parent";

export const VIEW_TYPE_SNW = "Strange New Worlds";

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
		return "file-digit";
	}

	async onOpen() {
		render(
			<div class="snw-sidepane-loading">
				<div class="snw-sidepane-loading-banner">Discovering Strange New Worlds...</div>
				<div class="snw-sidepane-loading-subtext">Click a reference counter in the main document for information to appear here.</div>
			</div>,
			this.containerEl.querySelector(".view-content") as HTMLElement,
		);
	}

	async updateView() {
		const plugin = this.plugin;

		this.containerEl.replaceChildren(
			await getUIC_SidePane(
				plugin.lastSelectedReferenceType,
				plugin.lastSelectedReferenceRealLink,
				plugin.lastSelectedReferenceKey,
				plugin.lastSelectedReferenceFilePath,
				plugin.lastSelectedLineNumber,
			),
		);

		scrollResultsIntoView(this.containerEl);
	}

	async onClose() {}
}
