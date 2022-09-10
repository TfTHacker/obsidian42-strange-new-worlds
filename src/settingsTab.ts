import { App, PluginSettingTab, Setting, ToggleComponent } from 'obsidian';
import ThePlugin from './main';

export interface Settings {
	debugMode: boolean
}

export const DEFAULT_SETTINGS: Settings = {
	debugMode: false
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
		containerEl.createEl('h2', { text: 'Obsidian42 - Strange New Worlds' });

		new Setting(containerEl)
			.setName('Developer Debugging Mode')
			.setDesc('Enable Debugging Mode for troubleshooting in the console.')
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.debugMode);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.debugMode = value;
					await this.plugin.saveSettings();
				});
			});
			
 
	}
}
