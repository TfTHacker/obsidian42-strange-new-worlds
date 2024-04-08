import { Notice } from 'obsidian';
import SNWPlugin from './main';

export default class PluginCommands {
  thePlugin: SNWPlugin;
  snwCommands = [
    {
      id: 'SNW-ToggleActiveState',
      icon: 'dot-network',
      name: 'Toggle active state of SNW plugin on/off',
      showInRibbon: true,
      callback: async () => {
        this.thePlugin.showCountsActive = !this.thePlugin.showCountsActive;
        let msg = 'SNW toggled ' + (this.thePlugin.showCountsActive ? 'ON\n\n' : 'OFF\n\n');
        msg += 'Tabs may require reloading for this change to take effect.';
        new Notice(msg);
        this.thePlugin.toggleStateHeaderCount();
        this.thePlugin.toggleStateSNWMarkdownPreview();
        this.thePlugin.toggleStateSNWLivePreview();
        this.thePlugin.toggleStateSNWGutters();
      }
    }
  ];

  constructor(plugin: SNWPlugin) {
    this.thePlugin = plugin;

    this.snwCommands.forEach(async (item) => {
      this.thePlugin.addCommand({
        id: item.id,
        name: item.name,
        icon: item.icon,
        callback: async () => {
          await item.callback();
        }
      });
    });
  }
}
