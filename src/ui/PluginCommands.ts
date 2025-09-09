import { Notice } from "obsidian";
import type SNWPlugin from "../main";

export default class PluginCommands {
	plugin: SNWPlugin;
	snwCommands = [
		{
			id: "SNW-ToggleActiveState",
			icon: "dot-network",
			name: "Toggle active state of SNW plugin on/off",
			callback: async () => {
				this.plugin.showCountsActive = !this.plugin.showCountsActive;
				let msg = `SNW toggled ${this.plugin.showCountsActive ? "ON\n\n" : "OFF\n\n"}`;
				msg += "Tabs may require reloading for this change to take effect.";
				new Notice(msg);
				this.plugin.toggleStateSNWMarkdownPreview();
				this.plugin.toggleStateSNWCMEditor();
				this.plugin.toggleStateSNWGutters();
			},
		},
		{
			id: "SNW-ActivateView",
			icon: "dot-network",
			name: "Show SNW",
			callback: async () => {
				await this.plugin.activateView();
			},
		},
	];

	constructor(plugin: SNWPlugin) {
		this.plugin = plugin;

		for (const item of this.snwCommands) {
			this.plugin.addCommand({
				id: item.id,
				name: item.name,
				icon: item.icon,
				callback: async () => {
					await item.callback();
				},
			});
		}
	}
}
