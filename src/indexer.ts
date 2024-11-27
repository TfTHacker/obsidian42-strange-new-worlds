// This module builds on Obsidians cache to provide more specific link information

import { type CachedMetadata, type HeadingCache, type Pos, type TFile, parseLinktext, stripHeading } from "obsidian";
import type SNWPlugin from "./main";
import type { TransformedCache } from "./types";

let indexedReferences = new Map();
let lastUpdateToReferences = 0;
let plugin: SNWPlugin;

export function setPluginVariableForIndexer(snwPlugin: SNWPlugin) {
	plugin = snwPlugin;
}

export function getIndexedReferences() {
	return indexedReferences;
}

// Primary Indexing function. Adss to the indexedReferences map all outgoing links from a given file
// The Database is primarily a key which is the link, and the value is an array of references that use that link
export const getLinkReferencesForFile = (file: TFile, cache: CachedMetadata) => {
	if (plugin.settings.enableIgnoreObsExcludeFoldersLinksFrom && file?.path && plugin.app.metadataCache.isUserIgnored(file?.path)) {
		return;
	}
	for (const item of [cache?.links, cache?.embeds, cache?.frontmatterLinks]) {
		if (!item) continue;
		for (const ref of item) {
			const { path, subpath } = ref.link.startsWith("#") // if link is pointing to itself, create a full path
				? parseLinktext(file.path.replace(`.${file.extension}`, "") + ref.link)
				: parseLinktext(ref.link);
			const tfileDestination = plugin.app.metadataCache.getFirstLinkpathDest(path, "/");
			if (tfileDestination) {
				if (
					plugin.settings.enableIgnoreObsExcludeFoldersLinksTo &&
					tfileDestination?.path &&
					plugin.app.metadataCache.isUserIgnored(tfileDestination.path)
				) {
					return;
				}
				// if the file has a property snw-index-exclude set to true, exclude it from the index
				if (plugin.app.metadataCache.getFileCache(tfileDestination)?.frontmatter?.["snw-index-exclude"] === true) continue;

				const linkWithFullPath = (
					tfileDestination ? tfileDestination.path.replace(`.${tfileDestination.extension}`, "") + subpath : path
				).toLocaleUpperCase();
				if (!indexedReferences.has(linkWithFullPath)) indexedReferences.set(linkWithFullPath, []);
				indexedReferences.get(linkWithFullPath).push({
					realLink: ref.link,
					reference: ref,
					resolvedFile: tfileDestination,
					sourceFile: file,
				});
			} else {
				// Null if it is a ghost file link, Create Ghost link
				const link = ref.link.toLocaleUpperCase();
				if (!indexedReferences.has(link)) indexedReferences.set(link, []);
				indexedReferences.get(link).push({
					realLink: ref.link,
					reference: ref,
					// mock up ghost file for linking
					resolvedFile: {
						path: `${path}.md`,
						name: `${path}.md`,
						basename: path,
						extension: "md",
					} as TFile,
					sourceFile: file,
				});
			}
		}
	}
};

// removes existing references from the map, used with getLinkReferencesForFile to rebuild the refeences
export const removeLinkReferencesForFile = async (file: TFile) => {
	for (const [key, items] of indexedReferences.entries()) {
		for (let i = items.length - 1; i >= 0; i--) {
			const item = items[i];
			if (item?.sourceFile && item?.sourceFile?.path === file.path) {
				items.splice(i, 1);
			}
		}
		if (items.length === 0) indexedReferences.delete(key);
		else indexedReferences.set(key, items);
	}
};

/**
 * Buildings a optimized list of cache references for resolving the block count.
 * It is only updated when there are data changes to the vault. This is hooked to an event
 * trigger in main.ts
 */
export function buildLinksAndReferences(): void {
	if (plugin.showCountsActive !== true) return;

	indexedReferences = new Map();
	for (const file of plugin.app.vault.getMarkdownFiles()) {
		const fileCache = plugin.app.metadataCache.getFileCache(file);
		if (fileCache) getLinkReferencesForFile(file, fileCache);
	}

	// @ts-ignore
	window.snwAPI.references = indexedReferences;
	lastUpdateToReferences = Date.now();
}

// following MAP works as a cache for the getCurrentPage call. Based on time elapsed since last update, it just returns a cached transformedCache object
const cacheCurrentPages = new Map<string, TransformedCache>();

// Provides an optimized view of the cache for determining the block count for references in a given page
export function getSNWCacheByFile(file: TFile): TransformedCache {
	if (plugin.showCountsActive !== true) return {};

	// Check if references have been updated since last cache update, and if cache is old
	const cachedPage = cacheCurrentPages.get(file.path.toLocaleUpperCase());
	if (cachedPage) {
		const cachedPageCreateDate = cachedPage.createDate ?? 0;
		if (lastUpdateToReferences < cachedPageCreateDate && cachedPageCreateDate + 1000 > Date.now()) {
			return cachedPage;
		}
	}

	const transformedCache: TransformedCache = {};
	const cachedMetaData = plugin.app.metadataCache.getFileCache(file);
	if (!cachedMetaData) return transformedCache;
	const filePathWithoutExtension = file.path.replace(`.${file.extension}`, "").toLocaleUpperCase();

	if (!indexedReferences) buildLinksAndReferences();

	if (cachedMetaData?.headings) {
		// filter - fFirst confirm there are references
		// map - map to the transformed cache
		const baseFilePath = `${filePathWithoutExtension}#`;
		const tempCacheHeadings = cachedMetaData.headings
			.filter((header) => indexedReferences.has(baseFilePath + stripHeading(header.heading).toLocaleUpperCase()))
			.map((header) => {
				const key = baseFilePath + stripHeading(header.heading).toLocaleUpperCase();
				return {
					original: "#".repeat(header.level) + header.heading,
					key,
					headerMatch: header.heading.replace(/\[|\]/g, ""),
					pos: header.position,
					page: file.basename,
					type: "heading" as const,
					references: indexedReferences.get(key),
				};
			});
		if (tempCacheHeadings.length > 0) transformedCache.headings = tempCacheHeadings;
	}
	if (cachedMetaData?.blocks) {
		// First confirm there are references to the block
		// then map the block to the transformed cache
		const tempCacheBlocks = Object.values(cachedMetaData.blocks)
			.filter((block) => (indexedReferences.get(`${filePathWithoutExtension}#^${block.id.toUpperCase()}`)?.length || 0) > 0)
			.map((block) => {
				const key = `${filePathWithoutExtension}#^${block.id.toLocaleUpperCase()}`;
				return {
					key,
					pos: block.position,
					page: file.basename,
					type: "block" as const,
					references: indexedReferences.get(key),
				};
			});
		if (tempCacheBlocks.length > 0) transformedCache.blocks = tempCacheBlocks;
	}

	if (cachedMetaData?.links) {
		const tempCacheLinks = cachedMetaData.links
			.filter((link) => {
				const linkPath =
					parseLinkTextToFullPath(link.link.startsWith("#") ? filePathWithoutExtension + link.link : link.link).toLocaleUpperCase() ||
					link.link.toLocaleUpperCase();
				const refs = indexedReferences.get(linkPath);
				return refs?.length > 0;
			})
			.map((link) => {
				const linkPath =
					parseLinkTextToFullPath(link.link.startsWith("#") ? filePathWithoutExtension + link.link : link.link).toLocaleUpperCase() ||
					link.link.toLocaleUpperCase();

				const result = {
					key: linkPath,
					original: link.original,
					type: "link" as const,
					pos: link.position,
					page: file.basename,
					references: indexedReferences.get(linkPath) || [],
				};

				// Handle heading references in one pass
				if (linkPath.includes("#") && !linkPath.includes("#^")) {
					result.original = linkPath.split("#")[1];
				}

				return result;
			});
		if (tempCacheLinks.length > 0) transformedCache.links = tempCacheLinks;
	}

	if (cachedMetaData?.embeds) {
		const tempCacheEmbeds = cachedMetaData.embeds
			.filter((embed) => {
				const embedPath =
					(embed.link.startsWith("#")
						? parseLinkTextToFullPath(filePathWithoutExtension + embed.link)
						: parseLinkTextToFullPath(embed.link)
					).toLocaleUpperCase() || embed.link.toLocaleUpperCase();
				const key = embedPath.startsWith("#") ? `${file.basename}${embedPath}` : embedPath;
				return indexedReferences.get(key)?.length > 0;
			})
			.map((embed) => {
				const getEmbedPath = () => {
					const rawPath = embed.link.startsWith("#") ? filePathWithoutExtension + embed.link : embed.link;
					return parseLinkTextToFullPath(rawPath).toLocaleUpperCase() || embed.link.toLocaleUpperCase();
				};

				const embedPath = getEmbedPath();
				const key = embedPath.startsWith("#") ? `${file.basename}${embedPath}` : embedPath;
				const [_, original] = key.includes("#") && !key.includes("#^") ? key.split("#") : [];

				return {
					key,
					page: file.basename,
					type: "embed" as const,
					pos: embed.position,
					references: indexedReferences.get(key) ?? [],
					...(original && { original }),
				};
			});
		if (tempCacheEmbeds.length > 0) transformedCache.embeds = tempCacheEmbeds;
	}

	if (cachedMetaData?.frontmatterLinks) {
		// filter - fFirst confirm there are references
		// map - map to the transformed cache
		const tempCacheFrontmatter = cachedMetaData.frontmatterLinks
			.filter((link) => indexedReferences.has(parseLinkTextToFullPath(link.link).toLocaleUpperCase() || link.link.toLocaleUpperCase()))
			.map((link) => {
				const linkPath = parseLinkTextToFullPath(link.link).toLocaleUpperCase() || link.link.toLocaleUpperCase();
				return {
					key: linkPath,
					original: link.original,
					type: "frontmatterLink" as const,
					pos: { start: { line: -1, col: -1, offset: -1 }, end: { line: -1, col: -1, offset: -1 } },
					displayText: link.displayText,
					page: file.basename,
					references: indexedReferences.get(linkPath) || [],
				};
			});
		if (tempCacheFrontmatter.length > 0) transformedCache.frontmatterLinks = tempCacheFrontmatter;
	}

	transformedCache.cacheMetaData = cachedMetaData;
	transformedCache.createDate = Date.now();
	cacheCurrentPages.set(file.path, transformedCache);

	return transformedCache;
}

export function parseLinkTextToFullPath(link: string): string {
	const resolvedFilePath = parseLinktext(link);
	const resolvedTFile = plugin.app.metadataCache.getFirstLinkpathDest(resolvedFilePath.path, "/");
	if (resolvedTFile === null) return "";

	return resolvedTFile.path.replace(`.${resolvedTFile.extension}`, "") + resolvedFilePath.subpath;
}
