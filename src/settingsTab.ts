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
	thePlugin: ThePlugin;

	constructor(app: App, plugin: ThePlugin) {
		super(app, plugin);
		this.thePlugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Display elements" });

		new Setting(containerEl)
			.setName('Incoming Links Header Count')
			.setDesc('In header of a document, show number of incoming link to that file.')
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.thePlugin.settings.displayIncomingFilesheader);
				cb.onChange(async (value: boolean) => {
					this.thePlugin.settings.displayIncomingFilesheader = value;
					await this.thePlugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('References Inline Documents')
			.setDesc('Display inline of the text of documents all reference counts for links, blocks and embeds. (Requires Obsidian Restart)')
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.thePlugin.settings.displayInlineReferences);
				cb.onChange(async (value: boolean) => {
					this.thePlugin.settings.displayInlineReferences = value;
					await this.thePlugin.saveSettings();
				});
			});


		new Setting(containerEl)
			.setName('Embed references in Gutter in Live Preview Mode  (Requires Obsidian Restart)')
			.setDesc(`Displays a count of references in the gutter while in live preview. This is done only in a
					  special scenario. It has to do with the way Obsidian renders embeds, example: ![[link]] when  
					  they are on its own line. Strange New Worlds cannot embed the count in this scenario, so a hint is 
					  displayed in the gutter. It is a hack, but at least we get some information.  (Requires Obsidian Restart)`	)
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.thePlugin.settings.displayEmbedReferencesInGutter);
				cb.onChange(async (value: boolean) => {
					this.thePlugin.settings.displayEmbedReferencesInGutter = value;
					await this.thePlugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Show line number for file in sidepane')
			.setDesc(`Displays a line number from the document in the sidepane.`	)
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.thePlugin.settings.displayLineNumberInSidebar);
				cb.onChange(async (value: boolean) => {
					this.thePlugin.settings.displayLineNumberInSidebar = value;
					await this.thePlugin.saveSettings();
				});
			});

	}
}