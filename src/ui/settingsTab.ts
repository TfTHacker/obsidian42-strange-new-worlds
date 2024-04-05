import { App, PluginSettingTab, Setting, ToggleComponent } from 'obsidian';
import SNWPlugin from '../main';

export interface Settings {
  enableOnStartupDesktop: boolean;
  enableOnStartupMobile: boolean;
  minimumRefCountThreshold: number; //minimum required to display a count
  maxFileCountToDisplay: number; // maximum number of items to display in popup or sidepane
  displayIncomingFilesheader: boolean;
  displayInlineReferencesLivePreview: boolean;
  displayInlineReferencesMarkdown: boolean;
  displayEmbedReferencesInGutter: boolean;
  displayEmbedReferencesInGutterMobile: boolean;
  cacheUpdateInMilliseconds: number;
  enableRenderingBlockIdInMarkdown: boolean;
  enableRenderingLinksInMarkdown: boolean;
  enableRenderingHeadersInMarkdown: boolean;
  enableRenderingEmbedsInMarkdown: boolean;
  enableRenderingBlockIdInLivePreview: boolean;
  enableRenderingLinksInLivePreview: boolean;
  enableRenderingHeadersInLivePreview: boolean;
  enableRenderingEmbedsInLivePreview: boolean;
  enableIgnoreObsExcludeFoldersLinksFrom: boolean; //Use Obsidians Exclude Files from folder - links from those files outgoing to other files
  enableIgnoreObsExcludeFoldersLinksTo: boolean; //Use Obsidians Exclude Files from folder - links to those "excluded" files
  requireModifierKeyToActivateSNWView: boolean; //require CTRL hover to activate SNW view
}

export const DEFAULT_SETTINGS: Settings = {
  enableOnStartupDesktop: true,
  enableOnStartupMobile: true,
  minimumRefCountThreshold: 1,
  maxFileCountToDisplay: 100,
  displayIncomingFilesheader: true,
  displayInlineReferencesLivePreview: true,
  displayInlineReferencesMarkdown: true,
  displayEmbedReferencesInGutter: true,
  displayEmbedReferencesInGutterMobile: false,
  cacheUpdateInMilliseconds: 500,
  enableRenderingBlockIdInMarkdown: true,
  enableRenderingLinksInMarkdown: true,
  enableRenderingHeadersInMarkdown: true,
  enableRenderingEmbedsInMarkdown: true,
  enableRenderingBlockIdInLivePreview: true,
  enableRenderingLinksInLivePreview: true,
  enableRenderingHeadersInLivePreview: true,
  enableRenderingEmbedsInLivePreview: true,
  enableIgnoreObsExcludeFoldersLinksFrom: false,
  enableIgnoreObsExcludeFoldersLinksTo: false,
  requireModifierKeyToActivateSNWView: false,
};

export class SettingsTab extends PluginSettingTab {
  thePlugin: SNWPlugin;

  constructor(app: App, plugin: SNWPlugin) {
    super(app, plugin);
    this.thePlugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: this.thePlugin.appName });

    containerEl.createEl('h2', { text: 'SNW Activation' });
    new Setting(containerEl)
      .setName('Require modifier key to activate SNW')
      .setDesc(
        `If enabled, SNW will only activate when the modifier key is pressed when hovering the mouse over an SNW counter.  
						Otherwise, SNW will activate on a mouse hover. May require reopening open files to take effect.`
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.requireModifierKeyToActivateSNWView);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.requireModifierKeyToActivateSNWView = value;
          await this.thePlugin.saveSettings();
        });
      });

    containerEl.createEl('h2', { text: 'Thresholds' });
    new Setting(containerEl)
      .setName('Minimal required count to show counter')
      .setDesc(
        `This setting defines how many references there needs to be for the reference count box to appear. May require reloading open files.
				 Currently set to: ${this.thePlugin.settings.minimumRefCountThreshold} references.`
      )
      .addSlider((slider) =>
        slider
          .setLimits(1, 1000, 1)
          .setValue(this.thePlugin.settings.minimumRefCountThreshold)
          .onChange(async (value) => {
            this.thePlugin.settings.minimumRefCountThreshold = value;
            await this.thePlugin.saveSettings();
          })
          .setDynamicTooltip()
      );

    new Setting(containerEl)
      .setName('Maximum file references to show')
      .setDesc(
        `This setting defines the max amount of files with their references are displayed in the popup or sidebar.  Set to 1000 for no maximum.
				 Currently set to: ${this.thePlugin.settings.maxFileCountToDisplay} references.`
      )
      .addSlider((slider) =>
        slider
          .setLimits(1, 1000, 1)
          .setValue(this.thePlugin.settings.maxFileCountToDisplay)
          .onChange(async (value) => {
            this.thePlugin.settings.maxFileCountToDisplay = value;
            await this.thePlugin.saveSettings();
          })
          .setDynamicTooltip()
      );

    containerEl.createEl('h2', {
      text: "Use Obsidian's Excluded Files list (Settings > Files & Links)",
    });

    new Setting(containerEl)
      .setName('Outgoing links')
      .setDesc(
        "If enabled, links FROM files in the excluded folder will not be included in SNW's reference counters. May require restarting Obsidian."
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.enableIgnoreObsExcludeFoldersLinksFrom);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.enableIgnoreObsExcludeFoldersLinksFrom = value;
          await this.thePlugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Incoming links') 
      .setDesc(
        "If enabled, links TO files in the excluded folder will not be included in SNW's reference counters.  May require restarting Obsidian."
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.enableIgnoreObsExcludeFoldersLinksTo);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.enableIgnoreObsExcludeFoldersLinksTo = value;
          await this.thePlugin.saveSettings();
        });
      });

    containerEl.createEl('h2', { text: 'Enable on startup' });
    new Setting(containerEl)
      .setName('Enable upon startup (Desktop)')
      .setDesc(
        'If disabled, SNW will not show block counters from startup until enabled from the command palette.'
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.enableOnStartupDesktop);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.enableOnStartupDesktop = value;
          await this.thePlugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Enable startup (Mobile)')
      .setDesc(
        'If disabled, SNW will not show block counters from startup until enabled from the command palette.'
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.enableOnStartupMobile);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.enableOnStartupMobile = value;
          await this.thePlugin.saveSettings();
        });
      });

    containerEl.createEl('h2', { text: 'View Modes' });

    new Setting(containerEl)
      .setName('Incoming Links Header Count')
      .setDesc('In header of a document, show number of incoming link to that file.')
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.displayIncomingFilesheader);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.displayIncomingFilesheader = value;
          this.thePlugin.toggleStateHeaderCount();
          await this.thePlugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Show SNW indicators in Live Preview Editor')
      .setDesc(
        'While using Live Preview, Display inline of the text of documents all reference counts for links, blocks and embeds.'
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.displayInlineReferencesLivePreview);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.displayInlineReferencesLivePreview = value;
          this.thePlugin.toggleStateSNWLivePreview();
          await this.thePlugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Show SNW indicators in Reading view ')
      .setDesc(
        'While in Reading View of a document, display inline of the text of documents all reference counts for links, blocks and embeds.'
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.displayInlineReferencesMarkdown);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.displayInlineReferencesMarkdown = value;
          this.thePlugin.toggleStateSNWMarkdownPreview();
          await this.thePlugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Embed references in Gutter in Live Preview Mode (Desktop)')
      .setDesc(
        `Displays a count of references in the gutter while in live preview. This is done only in a
					  special scenario. It has to do with the way Obsidian renders embeds, example: ![[link]] when  
					  they are on its own line. Strange New Worlds cannot embed the count in this scenario, so a hint is 
					  displayed in the gutter. It is a hack, but at least we get some information.`
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.displayEmbedReferencesInGutter);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.displayEmbedReferencesInGutter = value;
          this.thePlugin.toggleStateSNWGutters();
          await this.thePlugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Embed references in Gutter in Live Preview Mode (Mobile)')
      .setDesc(
        `This is off by default on mobile since the gutter takes up some space in the left margin.`
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.displayEmbedReferencesInGutterMobile);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.displayEmbedReferencesInGutterMobile = value;
          this.thePlugin.toggleStateSNWGutters();
          await this.thePlugin.saveSettings();
        });
      });

    containerEl.createEl('h2', { text: 'Enable Reference Types in Reading mode' });
    containerEl.createEl('sup', {
      text: '(requires reopening documents to take effect)',
    });

    new Setting(containerEl)
      .setName('Block ID')
      .setDesc(
        "Identifies block ID's, for example text blocks that end with a ^ and unique ID for that text block."
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.enableRenderingBlockIdInMarkdown);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.enableRenderingBlockIdInMarkdown = value;
          await this.thePlugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Embeds')
      .setDesc(
        'Identifies embedded links, that is links that start with an explanation mark. For example: ![[PageName]].'
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.enableRenderingEmbedsInMarkdown);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.enableRenderingEmbedsInMarkdown = value;
          await this.thePlugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Links')
      .setDesc('Identifies links in a document. For example: [[PageName]].')
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.enableRenderingLinksInMarkdown);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.enableRenderingLinksInMarkdown = value;
          await this.thePlugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Headers')
      .setDesc(
        'Identifies headers, that is lines of text that start with a hash mark or multiple hash marks. For example: # Heading 1.'
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.enableRenderingHeadersInMarkdown);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.enableRenderingHeadersInMarkdown = value;
          await this.thePlugin.saveSettings();
        });
      });

    containerEl.createEl('h2', { text: 'Enable Reference Types in Live Preview Mode' });
    containerEl.createEl('sup', {
      text: '(requires reopening documents to take effect)',
    });

    new Setting(containerEl)
      .setName('Block ID')
      .setDesc(
        "Identifies block ID's, for example text blocks that end with a ^ and unique ID for that text block."
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.enableRenderingBlockIdInLivePreview);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.enableRenderingBlockIdInLivePreview = value;
          await this.thePlugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Embeds')
      .setDesc(
        'Identifies embedded links, that is links that start with an explanation mark. For example: ![[PageName]].'
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.enableRenderingEmbedsInLivePreview);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.enableRenderingEmbedsInLivePreview = value;
          await this.thePlugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Links')
      .setDesc('Identifies links in a document. For example: [[PageName]].')
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.enableRenderingLinksInLivePreview);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.enableRenderingLinksInLivePreview = value;
          await this.thePlugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Headers')
      .setDesc(
        'Identifies headers, that is lines of text that start with a hash mark or multiple hash marks. For example: # Heading 1.'
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.thePlugin.settings.enableRenderingHeadersInLivePreview);
        cb.onChange(async (value: boolean) => {
          this.thePlugin.settings.enableRenderingHeadersInLivePreview = value;
          await this.thePlugin.saveSettings();
        });
      });

    containerEl.createEl('h2', { text: 'Cache Tuning' });

    new Setting(containerEl)
      .setName(`How often should the SNW Cache update`)
      .setDesc(
        `By default SNW will updates its internal cache every half a second (500 milliseconds) when there is some change in the vault.
					  Increase the time to slighlty improve performance on less performant devices or decrease it to improve refresh of vault information.
					  Currently set to: ${this.thePlugin.settings.cacheUpdateInMilliseconds} milliseconds. (Requires Obsidian Restart)`
      )
      .addSlider((slider) =>
        slider
          .setLimits(500, 30000, 100)
          .setValue(this.thePlugin.settings.cacheUpdateInMilliseconds)
          .onChange(async (value) => {
            this.thePlugin.settings.cacheUpdateInMilliseconds = value;
            await this.thePlugin.saveSettings();
          })
          .setDynamicTooltip()
      );
  }
}
