// This module builds on Obsidians cache to provide more specific link information

import { CachedMetadata, HeadingCache, TFile, Pos, parseLinktext } from 'obsidian';
import SNWPlugin from './main';
import { TransformedCache } from './types';

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
      const { path, subpath } = parseLinktext(ref.link);
      const tfileDestination = app.metadataCache.getFirstLinkpathDest(path, '/');
      if (
        plugin.settings.enableIgnoreObsExcludeFoldersLinksTo &&
        tfileDestination?.path &&
        plugin.app.metadataCache.isUserIgnored(tfileDestination.path)
      ) {
        return;
      }
      const cacheDestination = tfileDestination ? app.metadataCache.getFileCache(tfileDestination) : null;
      // if the file has a property snw-index-exclude set to true, exclude it from the index
      if (cacheDestination && cacheDestination?.frontmatter && cacheDestination?.frontmatter['snw-index-exclude'] === true) continue;
      const linkWithFullPath = tfileDestination ? tfileDestination.path.replace('.' + tfileDestination.extension, '') + subpath : path;

      if (!indexedReferences.has(linkWithFullPath)) indexedReferences.set(linkWithFullPath, []);
      indexedReferences.get(linkWithFullPath).push({
        realLink: ref.link,
        reference: ref,
        resolvedFile: tfileDestination,
        sourceFile: file
      });
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
    indexedReferences.set(key, items);
  }
};

/**
 * Buildings a optimized list of cache references for resolving the block count.
 * It is only updated when there are data changes to the vault. This is hooked to an event
 * trigger in main.ts
 */
export function buildLinksAndReferences(): void {
  if (plugin.showCountsActive != true) return;

  indexedReferences = new Map();
  for (const file of app.vault.getMarkdownFiles()) {
    const fileCache = app.metadataCache.getFileCache(file);
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
  if (cacheCurrentPages.has(file.path)) {
    const cachedPage = cacheCurrentPages.get(file.path);
    if (cachedPage) {
      const cachedPageCreateDate = cachedPage.createDate ?? 0;
      // Check if references have been updated since last cache update, and if cache is old
      if (lastUpdateToReferences < cachedPageCreateDate && cachedPageCreateDate + 500 > Date.now()) {
        return cachedPage;
      }
    }
  }
  if (plugin.showCountsActive != true) return {};

  const transformedCache: TransformedCache = {};
  const cachedMetaData = plugin.app.metadataCache.getFileCache(file);
  if (!cachedMetaData) {
    return transformedCache;
  }

  if (!indexedReferences) {
    buildLinksAndReferences();
  }

  const headings: string[] = Object.values(plugin.app.metadataCache.metadataCache).reduce((acc: string[], file: CachedMetadata) => {
    const headings = file.headings;
    if (headings) {
      headings.forEach((heading: HeadingCache) => {
        acc.push(heading.heading);
      });
    }
    return acc;
  }, []);

  if (cachedMetaData?.blocks) {
    const filePath = file.path.replace('.' + file.extension, '');
    transformedCache.blocks = Object.values(cachedMetaData.blocks).map((block) => {
      const key = filePath + '#^' + block.id;
      return {
        key: key,
        pos: block.position,
        page: file.basename,
        type: 'block',
        references: indexedReferences.get(key) || []
      };
    });
  }

  if (cachedMetaData?.headings) {
    transformedCache.headings = cachedMetaData.headings.map((header: { heading: string; position: Pos; level: number }) => {
      const headingString = '#'.repeat(header.level) + header.heading;
      const key = `${file.path.replace('.' + file.extension, '')}#${header.heading.replace(/\[|\]/g, '')}`;
      return {
        original: headingString,
        key: key,
        headerMatch: header.heading.replaceAll('[', '').replaceAll(']', ''),
        pos: header.position,
        page: file.basename,
        type: 'heading',
        references: indexedReferences.get(key) || []
      };
    });
  }

  if (cachedMetaData?.links) {
    transformedCache.links = cachedMetaData.links.map((link) => {
      let newLinkPath = parseLinkTextToFullPath(link.link);

      if (newLinkPath === '') {
        // file does not exist, likely a ghost file, so just leave the link
        newLinkPath = link.link;
      }

      if (newLinkPath.startsWith('#^') || newLinkPath.startsWith('#')) {
        // handles links from same page
        newLinkPath = file.path.replace('.' + file.extension, '') + newLinkPath;
      }

      return {
        key: newLinkPath,
        original: link.original,
        type: 'link',
        pos: link.position,
        page: file.basename,
        references: indexedReferences.get(newLinkPath) || []
      };
    });
    if (transformedCache.links) {
      transformedCache.links = transformedCache.links.map((link) => {
        if (link.key.includes('#') && !link.key.includes('#^')) {
          const heading = headings.filter((heading: string) => heading === link.key.split('#')[1])[0];
          link.original = heading ? heading : undefined;
        }
        return link;
      });
    }
  }

  if (cachedMetaData?.embeds) {
    transformedCache.embeds = cachedMetaData.embeds.map((embed) => {
      let newEmbedPath = parseLinkTextToFullPath(embed.link);

      // if newEmbedPath is empty, then this is a link on the same page
      if (newEmbedPath === '' && (embed.link.startsWith('#^') || embed.link.startsWith('#'))) {
        newEmbedPath = file.path.replace('.' + file.extension, '') + embed.link;
      }

      const output = {
        key: newEmbedPath,
        page: file.basename,
        type: 'embed',
        pos: embed.position,
        references: indexedReferences.get(newEmbedPath) || []
      };
      return output;
    });
    if (transformedCache.embeds) {
      transformedCache.embeds = transformedCache.embeds.map((embed) => {
        if (embed.key.includes('#') && !embed.key.includes('#^') && transformedCache.headings) {
          const heading = headings.filter((heading: string) => heading.includes(embed.key.split('#')[1]))[0];
          embed.original = heading ? heading : undefined;
        }

        if (embed.key.startsWith('#^') || embed.key.startsWith('#')) {
          embed.key = `${file.basename}${embed.key}`;
          embed.references = indexedReferences.get(embed.key) || [];
        }
        return embed;
      });
    }
  }

  if (cachedMetaData?.frontmatterLinks) {
    transformedCache.frontmatterLinks = cachedMetaData.frontmatterLinks.map((link) => {
      let newLinkPath = parseLinkTextToFullPath(link.link);

      if (newLinkPath === '') {
        // file does not exist, likely a ghost file, so just leave the link
        newLinkPath = link.link;
      }

      return {
        key: newLinkPath,
        original: link.original,
        type: 'frontmatterLink',
        pos: { start: { line: -1, col: -1, offset: -1 }, end: { line: -1, col: -1, offset: -1 } },
        displayText: link.displayText,
        page: file.basename,
        references: indexedReferences.get(newLinkPath) || []
      };
    });
  }

  transformedCache.cacheMetaData = cachedMetaData;
  transformedCache.createDate = Date.now();
  cacheCurrentPages.set(file.path, transformedCache);

  return transformedCache;
}

export function parseLinkTextToFullPath(link: string): string {
  const resolvedFilePath = parseLinktext(link);
  const resolvedTFile = plugin.app.metadataCache.getFirstLinkpathDest(resolvedFilePath.path, '/');
  if (resolvedTFile === null) return '';
  else return resolvedTFile.path.replace('.' + resolvedTFile.extension, '') + resolvedFilePath.subpath;
}
