// This module builds on Obsidians cache to provide more specific link information

import { CachedMetadata, HeadingCache, stripHeading, TFile, Pos} from "obsidian";
import ThePlugin from "./main";
import {Link, TransformedCache} from "./types";

let references: {[x:string]:Link[]};
let allLinkRsolutions: Link[];
let lastUpdateToReferences = 0;
let thePlugin: ThePlugin;

export function setPluginVariableForIndexer(plugin: ThePlugin) {
    thePlugin = plugin;
}

export function getReferencesCache() {
    return references;
}

export function getSnwAllLinksResolutions(){
    return allLinkRsolutions;
}

/**
 * Buildings a optimized list of cache references for resolving the block count. 
 * It is only updated when there are data changes to the vault. This is hooked to an event
 * trigger in main.ts
 * @export
 */
export function buildLinksAndReferences(): void {
    allLinkRsolutions = thePlugin.app.fileManager.getAllLinkResolutions(); //cache this for use in other pages
    const refs = allLinkRsolutions.reduce((acc: {[x:string]: Link[]}, link : Link): { [x:string]: Link[] } => {
        
        let keyBasedOnLink = "";
        let keyBasedOnFullPath = ""

        keyBasedOnLink = link.reference.link;
        keyBasedOnFullPath = link.resolvedFile.path.replace(link.resolvedFile.name,"") + link.reference.link;

        if(keyBasedOnLink===keyBasedOnFullPath) {
            keyBasedOnFullPath=null;
        }

        if(!acc[keyBasedOnLink]) {  
            acc[keyBasedOnLink] = [];
        }
        acc[keyBasedOnLink].push(link);

        if(keyBasedOnFullPath!=null) {
            if(!acc[keyBasedOnFullPath]) {
                acc[keyBasedOnFullPath] = [];
            }
            acc[keyBasedOnFullPath].push(link)
        } 
        return acc;
    }, {});

    references = refs;
    // @ts-ignore
    window.snwAPI.references = references;
    lastUpdateToReferences = Date.now();
}


// following MAP works as a cache for the getCurrentPage call. Based on time elapsed since last update, it just returns a cached transformedCache object
const cacheCurrentPages = new Map<string,TransformedCache>();

/**
 * Provides an optimized view of the cache for determining the block count for references in a given page
 *
 * @export
 * @param {TFile} file
 * @return {*}  {TransformedCache}
 */
export function getSNWCacheByFile(file: TFile): TransformedCache {

    if(cacheCurrentPages.has(file.path)) {
        const cachedPage = cacheCurrentPages.get(file.path);
        // Check if references have been updated since last cache update, and if cache is old
        if( (lastUpdateToReferences < cachedPage.createDate) && ((cachedPage.createDate+thePlugin.settings.cacheUpdateInMilliseconds) > Date.now()) ) {
            return cachedPage;
        }
    }

    const transformedCache: TransformedCache = {};
    const cachedMetaData = thePlugin.app.metadataCache.getFileCache(file);
    if (!cachedMetaData) {
        return transformedCache;
    }

    if (!references) {
        buildLinksAndReferences();
    }

    const headings: string[] = Object.values(thePlugin.app.metadataCache.metadataCache).reduce((acc : string[], file : CachedMetadata) => {
        const headings = file.headings;
        if (headings) {
            headings.forEach((heading : HeadingCache) => {
                acc.push(heading.heading);
            });
        }
        return acc;
    }, []);


    if (cachedMetaData?.blocks) {
        const filePath = file.path.replace(".md","");
        transformedCache.blocks = Object.values(cachedMetaData.blocks).map((block) => ({
            key: filePath + "#^" + block.id,
            pos: block.position,
            page: file.basename,
            type: "block",
            references: references[ filePath + "#^" + block.id ] || []
        }));
    }

    if (cachedMetaData?.headings) {
        transformedCache.headings = cachedMetaData.headings.map((header: {heading: string; position: Pos; level: number;}) => ({
            original: "#".repeat(header.level) + " " + header.heading,
            key: `${file.path.replace(".md","")}#${stripHeading(header.heading)}`, 
            headerMatch: header.heading,
            headerMatch2: file.basename + "#" + header.heading,
            pos: header.position,
            page: file.basename,
            type: "heading",
            references: references[`${file.path.replace(".md","")}#${stripHeading(header.heading)}`] || 
                        references[`${file.basename}$#${(stripHeading(header.heading))}`] || []
        }));
    }

    if (cachedMetaData?.links) {
        transformedCache.links = cachedMetaData.links.map((link) => {
            return {
                key: link.link,
                original: link.original,
                type: "link",
                pos: link.position,
                page: file.basename,
                references: references[link.link] || []
            };
        });
        if (transformedCache.links) {
            transformedCache.links = transformedCache.links.map((link) => {
                if (link.key.includes("#") && !link.key.includes("#^")) {
                    const heading = headings.filter((heading : string) => stripHeading(heading) === link.key.split("#")[1])[0];
                    link.original = heading ? heading : undefined;
                }
                return link;
            });            
        }
    }

    if (cachedMetaData?.embeds) {
        transformedCache.embeds = cachedMetaData.embeds.map((embed) => {
            return {
                key: embed.link,
                page: file.basename,
                type: "embed",
                pos: embed.position,
                references: references[embed.link] || []
            };
        });
        if (transformedCache.embeds) {
            transformedCache.embeds = transformedCache.embeds.map((embed) => {
                if (embed.key.includes("#") && !embed.key.includes("#^") && transformedCache.headings) {
                    const heading = headings.filter((heading : string) => heading.includes(embed.key.split("#")[1]))[0];

                    embed.original = heading ? heading : undefined;
                }

                if (embed.key.startsWith("#^") || embed.key.startsWith("#")) {
                    embed.key = `${file.basename}${embed.key}`;
                    embed.references = references[embed.key] || [];
                }
                return embed;
            });
        }
    }

    transformedCache.cacheMetaData = cachedMetaData;
    transformedCache.createDate = Date.now();
    cacheCurrentPages.set(file.path, transformedCache);

    return transformedCache;
}
