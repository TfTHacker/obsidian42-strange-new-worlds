import { type App, type TFile } from "obsidian";
import type SNWPlugin from "./main";
import { DisplayNameMode } from "./settings";

export function getDisplayFileName(plugin: SNWPlugin, file: TFile): string {
	const mode = plugin.settings.displayNameMode;

	return getDisplayFileNameByMode(plugin.app, file, mode);
}

function getDisplayFileNameByMode(app: App, file: TFile, mode: DisplayNameMode): string {
	if (mode === DisplayNameMode.Basename) return file.basename;

	const aliases = app.metadataCache.getFileCache(file)?.frontmatter?.aliases;

	if (Array.isArray(aliases)) {
		const first = aliases.find(
			(alias): alias is string => typeof alias === "string" && alias.trim().length > 0,
		);

		if (first !== undefined) return first;
	}

	if (typeof aliases === "string" && aliases.trim().length > 0) return aliases;

	return file.basename;
}

export function getDisplayLink(plugin: SNWPlugin, realLink: string, filePath: string): string {
	const mode = plugin.settings.displayNameMode;

	return getDisplayLinkByMode(plugin.app, realLink, filePath, mode);
}

function getDisplayLinkByMode(
	app: App,
	realLink: string,
	filePath: string,
	mode: DisplayNameMode,
): string {
	if (mode === DisplayNameMode.Basename) return realLink;

	const file = app.metadataCache.getFirstLinkpathDest(filePath, filePath);

	if (!file) return realLink;

	const display = getDisplayFileNameByMode(app, file, mode);

	const hash = realLink.indexOf("#");

	if (hash < 0) return display;

	return display + realLink.substring(hash);
}