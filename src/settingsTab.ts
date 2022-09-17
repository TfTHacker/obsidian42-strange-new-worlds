import { App, PluginSettingTab, Setting, ToggleComponent } from 'obsidian';
import ThePlugin from './main';

export interface Settings {
	displayIncomingFilesheader: 	boolean;
	displayInlineReferences: 		boolean;
	displayEmbedReferencesInGutter:	boolean;
	displayLineNumberInSidebar:		boolean;
}

export const DEFAULT_SETTINGS: Settings = {
	displayIncomingFilesheader: true,
	displayInlineReferences: true,
	displayEmbedReferencesInGutter: true,
	displayLineNumberInSidebar: true
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

		new Setting(containerEl)
			.setName('References Inline Documents')
			.setDesc('Display inline of the text of documents all reference counts for links, blocks and embeds.')
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.displayInlineReferences);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.displayInlineReferences = value;
					await this.plugin.saveSettings();
				});
			});


		new Setting(containerEl)
			.setName('Embed references in Gutter in Live Preview Mode')
			.setDesc(`Displays a count of references in the gutter while in live preview. This is done only in a
					  special scenario. It has to do with the way Obsidian renders embeds, example: ![[link]] when  
					  they are on its own line. Strange New Worlds cannot embed the count in this scenario, so a hint is 
					  displayed in the gutter. It is a hack, but at least we get some information.`	)
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.displayEmbedReferencesInGutter);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.displayEmbedReferencesInGutter = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Show line number for file in sidepane')
			.setDesc(`Displays a line number from the document in the sidepane.`	)
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.displayLineNumberInSidebar);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.displayLineNumberInSidebar = value;
					await this.plugin.saveSettings();
				});
			});

	}
}