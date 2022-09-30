import { CachedMetadata, HeadingCache, stripHeading, TFile, Pos} from "obsidian";
import ThePlugin from "./main";
import {Link, TransformedCache} from "./types";
// import {Link, ListItem, Section, TransformedCache} from "./types";


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

export function buildLinksAndReferences(): void {
    allLinkRsolutions = thePlugin.app.fileManager.getAllLinkResolutions(); //cache this for use in other pages
    const refs = allLinkRsolutions.reduce((acc: {[x:string]: Link[]}, link : Link): { [x:string]: Link[] } => {
        
        let keyBasedOnLink = "";
        let keyBasedOnFullPath = ""

        keyBasedOnLink = link.reference.link;
        keyBasedOnFullPath = link.resolvedFile.path.replace(link.resolvedFile.name,"") + link.reference.link;

        if(!acc[keyBasedOnLink]) { 
            acc[keyBasedOnLink] = [];
        }
        acc[keyBasedOnLink].push(link);

        if(!acc[keyBasedOnFullPath]) {
            acc[keyBasedOnFullPath] = [];
        }
        acc[keyBasedOnFullPath].push(link)

        return acc;
    }, {});

    references = refs;
    // @ts-ignore
    window.snwRefs = references;
    lastUpdateToReferences = Date.now();
}


// following MAP works as a cache for the getCurrentPage call. Based on time elapsed since last update, it just returns a cached transformedCache object
const cacheCurrentPages = new Map<string,TransformedCache>();

export function getCurrentPage(file: TFile): TransformedCache {

    if(cacheCurrentPages.has(file.path)) {
        const cachedPage = cacheCurrentPages.get(file.path);
        // Check if references have been updated since last cache update, and if cache is old
        if( (lastUpdateToReferences < cachedPage.createDate) && ((cachedPage.createDate+thePlugin.settings.cacheUpdateInMilliseconds) > Date.now()) ) {
            return cachedPage;
        }
    }

    const transformedCache: TransformedCache = {};
    const cachedMetaData = thePlugin.app.metadataCache.getFileCache(file);
    if (! cachedMetaData) {
        return transformedCache;
    }

    if (! references) {
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
            key: `${file.path.replace(".md","")}#${header.heading}`, 
            headerMatch: header.heading,
            headerMatch2: file.basename + "#".repeat(header.level) + header.heading,
            pos: header.position,
            page: file.basename,
            type: "heading",
            references: references[`${file.path.replace(".md","")}${"#".repeat(header.level) + header.heading}`] || 
                        references[`${file.basename}${"#".repeat(header.level) + (header.heading)}`] || []
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
                // if (link.key.includes("/")) {
                //     const keyArr = link.key.split("/");
                //     link.key = keyArr[keyArr.length - 1];
                // }
                if (link.key.includes("#") && !link.key.includes("#^")) {
                    const heading = headings.filter((heading : string) => stripHeading(heading) === link.key.split("#")[1])[0];
                    link.original = heading ? heading : undefined;
                }
                // if (link.key.startsWith("#^") || link.key.startsWith("#")) {
                //     link.key = `${link.page}${link.key}`;
                //     link.references = references[link.key] || [];
                // }
                return link;
            });
            // remove duplicate links
            // if (transformedCache.links) 
            //     transformedCache.linksWithoutDuplicates = transformedCache.links.filter((link, index, self) => index === self.findIndex((t) => (t.key === link.key)))
            
        }
    }

    if (cachedMetaData?.embeds) {
        transformedCache.embeds = cachedMetaData.embeds.map((embed) => {
            // if (embed.link.includes("/")) {
            //     const keyArr = embed.link.split("/");
            //     embed.link = keyArr[keyArr.length - 1];
            // }
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
            // remove duplicate blocks
            // if (transformedCache.embeds) 
            //     transformedCache.embedsWithDuplicates = transformedCache.embeds.filter((embed, index, self) => index === self.findIndex((t) => (t.key === embed.key)))

        }
    }


    transformedCache.cacheMetaData = cachedMetaData;
    transformedCache.createDate = Date.now();
    cacheCurrentPages.set(file.path, transformedCache);

    return transformedCache;
}

/**
 * If the section is of type list, add the list items from the metadataCache to the section object.
 * This makes it easier to iterate a list when building block ref buttons
 *
 * @param   {SectionCache[]}                sections
 * @param   {ListItemCache[]}               listItems
 *
 * @return  {Section[]}                        Array of sections with additional items key
//  */

// function createListSections(cache: CachedMetadata): Section[] {
//     if (cache.listItems) {
//         return cache.sections.map((section) => {
//                 const items: ListItem[] = [];
//                 if (section.type === "list") {
//                     cache.listItems.forEach((item : ListItem) => {
//                             if (item.position.start.line >= section.position.start.line && item.position.start.line<= section.position.end.line
//                     ) {
//                         const id = cache.embeds?.find(
//                             (embed) => embed.position.start.line === item.position.start.line)  ?. link || cache.links ?. find((link) => link.position.start.line === item.position.start.line) ?. link || "";
                            
//                             items.push({
//                                 key: id,
//                                 pos: item.position,
//                                 ...item
//                             });
//                         }}
//                 );
//                 const sectionWithItems = {
//                     items,
//                     ...section
//                 };
//                 return sectionWithItems;
//             }
//             return section;
//         }
//     );
// }

// return cache.sections;}
