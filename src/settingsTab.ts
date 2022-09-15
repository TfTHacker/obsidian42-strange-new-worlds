import { App, PluginSettingTab, Setting, ToggleComponent } from 'obsidian';
import ThePlugin from './main';

export interface Settings {
	displayIncomingFilesheader: boolean
}

export const DEFAULT_SETTINGS: Settings = {
	displayIncomingFilesheader: true
}

export class SettingsTab extends PluginSettingTab {
	plugin: ThePlugin;

	constructor(app: App, plugin: ThePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Display elements" });

		new Setting(containerEl)
			.setName('Incoming Links Header Count')
			.setDesc('In header of a document, show number of incoming link to that file.')
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.displayIncomingFilesheader);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.displayIncomingFilesheader = value;
					await this.plugin.saveSettings();
				});
			});
 
	}
}