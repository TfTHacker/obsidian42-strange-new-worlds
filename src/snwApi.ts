import { getIndexedReferences, getSNWCacheByFile, parseLinkTextToFullPath } from "./indexer";
import type SNWPlugin from "./main";

/**
 * Provide a simple API for use with Templater, Dataview and debugging the complexities of various pages.
 * main.ts will attach this to window.snwAPI
 */
export default class SnwAPI {
	plugin: SNWPlugin;
	references = new Map();

	constructor(snwPlugin: SNWPlugin) {
		this.plugin = snwPlugin;
	}

	console = (logDescription: string, ...outputs: unknown[]): void => {
		console.log(`SNW: ${logDescription}`, outputs);
	};

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	getMetaInfoByCurrentFile = async (): Promise<any> => {
		return this.getMetaInfoByFileName(this.plugin.app.workspace.getActiveFile()?.path || "");
	};

	searchReferencesStartingWith = async (searchString: string) => {
		for (const [key, value] of getIndexedReferences()) {
			if (key.startsWith(searchString)) {
				console.log(key, value);
			}
		}
	};

	searchReferencesContains = async (searchString: string) => {
		for (const [key, value] of getIndexedReferences()) {
			if (key.contains(searchString)) {
				console.log(key, value);
			}
		}
	};

	// For given file name passed into the function, get the meta info for that file
	getMetaInfoByFileName = async (fileName: string) => {
		const currentFile = this.plugin.app.metadataCache.getFirstLinkpathDest(fileName, "/");
		return {
			TFile: currentFile,
			metadataCache: currentFile ? this.plugin.app.metadataCache.getFileCache(currentFile) : null,
			SnwTransformedCache: currentFile ? getSNWCacheByFile(currentFile) : null,
		};
	};

	parseLinkTextToFullPath(linkText: string) {
		return parseLinkTextToFullPath(linkText);
	}
}
