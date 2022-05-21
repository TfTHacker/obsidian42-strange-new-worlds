import { App, CachedMetadata, HeadingCache, stripHeading, TFile, Pos} from "obsidian";
import {Link, ListItem, Section, TransformedCache} from "./types";

let references: {[x:string]:Link[]};

export function buildLinksAndReferences(app: App): void {
    console.log("building links and references");
    const refs = app.fileManager.getAllLinkResolutions().reduce((acc : {
        [x : string]: Link[] 
    }, link : Link) : {
        [x : string]: Link[]
    } => {
        let key = link.reference.link;
        if (key.includes("/")) {
            const keyArr = key.split("/");
            key = keyArr[keyArr.length - 1];
        }
        if (!acc[key]) {
            acc[key] = [];
        }
        if (acc[key]) {
            acc[key].push(link);
        }
        return acc;
    }, {});
    const allLinks = Object.entries(app.metadataCache.getLinks()).reduce((acc, [key, links]) => {
        links.forEach((link : {
            link: string;
            original: string;
            position: Pos;
        }) : void => {
            if (link.original.startsWith("[[#") || link.original.startsWith("![[#")) {
                const newLink: Link = {
                    reference: {
                        link: link.link,
                        displayText: link.link,
                        position: link.position
                    },
                    resolvedFile: app.vault.getAbstractFileByPath(key)as TFile,
                    resolvedPaths: [link.link],
                    sourceFile: app.vault.getAbstractFileByPath(key)as TFile
                };
                acc.push(newLink);
            }
        });
        return acc;
    }, []);
    allLinks.forEach((link : Link) => {
        if (link.sourceFile) {
            const key = `${
                link.sourceFile.basename
            }${
                link.reference.link
            }`;
            if (! refs[key]) {
                refs[key] = [];
            }
            if (refs[key]) {
                refs[key].push(link);
            }
        }
    });

    // update incoming link references


    references = refs;
}

export function getReferencesCache() {
    return references;
}

export function getCurrentPage(file: TFile, app: App): TransformedCache {
    const transformedCache: TransformedCache = {};
    const cachedMetaData = app.metadataCache.getFileCache(file);
    if (! cachedMetaData) {
        return transformedCache;
    }

    if (! references) {
        buildLinksAndReferences(app);
    }
    const headings: string[] = Object.values(app.metadataCache.metadataCache).reduce((acc : string[], file : CachedMetadata) => {
        const headings = file.headings;
        if (headings) {
            headings.forEach((heading : HeadingCache) => {
                acc.push(heading.heading);
            });
        }
        return acc;
    }, []);
    if (cachedMetaData ?. blocks) {
        transformedCache.blocks = Object.values(cachedMetaData.blocks).map((block) => ({
            key: block.id,
            pos: block.position,
            page: file.basename,
            type: "block",
            references: references[`${
                    file.basename
                }#^${
                    block.id
                }`] || []
        }));
    }
    if (cachedMetaData ?. headings) {
        transformedCache.headings = cachedMetaData.headings.map((header : {
            heading: string;
            position: Pos;
            level: number;
        }) => ({
            original: "#".repeat(header.level) + " " + header.heading,
            key: stripHeading(header.heading),
            pos: header.position,

            page: file.basename,
            type: "header",
            references: references[`${
                    file.basename
                }#${
                    stripHeading(header.heading)
                }`] || []
        }));
    }
    if (cachedMetaData ?. sections) {
        transformedCache.sections = createListSections(cachedMetaData);
    }
    if (cachedMetaData ?. links) {
        transformedCache.links = cachedMetaData.links.map((link) => {
            if (link.link.includes("/")) {
                const keyArr = link.link.split("/");
                link.link = keyArr[keyArr.length - 1];
            }
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
                if (link.key.includes("/")) {
                    const keyArr = link.key.split("/");
                    link.key = keyArr[keyArr.length - 1];
                }
                if (link.key.includes("#") && !link.key.includes("#^")) {
                    const heading = headings.filter((heading : string) => stripHeading(heading) === link.key.split("#")[1])[0];
                    link.original = heading ? heading : undefined;
                }
                if (link.key.startsWith("#^") || link.key.startsWith("#")) {
                    link.key = `${
                        link.page
                    }${
                        link.key
                    }`;
                    link.references = references[link.key] || [];
                }
                return link;
            });
            // remove duplicate links
            if (transformedCache.links) 
                transformedCache.linksWithoutDuplicates = transformedCache.links.filter((link, index, self) => index === self.findIndex((t) => (t.key === link.key)))
            
        }
    }

    if (cachedMetaData ?. embeds) {
        transformedCache.embeds = cachedMetaData.embeds.map((embed) => {
            if (embed.link.includes("/")) {
                const keyArr = embed.link.split("/");
                embed.link = keyArr[keyArr.length - 1];
            }
            return {
                key: embed.link,
                page: file.basename,
                type: "link",
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
                    embed.key = `${
                        file.basename
                    }${
                        embed.key
                    }`;
                    embed.references = references[embed.key] || [];
                }
                return embed;
            });
            // remove duplicate blocks
            if (transformedCache.embeds) 
                transformedCache.embedsWithDuplicates = transformedCache.embeds.filter((embed, index, self) => index === self.findIndex((t) => (t.key === embed.key)))

            

        }
    }
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
 */

function createListSections(cache: CachedMetadata): Section[] {
    if (cache.listItems) {
        return cache.sections.map((section) => {
                const items: ListItem[] = [];
                if (section.type === "list") {
                    cache.listItems.forEach((item : ListItem) => {
                            if (item.position.start.line >= section.position.start.line && item.position.start.line<= section.position.end.line
                    ) {
                        const id = cache.embeds?.find(
                            (embed) => embed.position.start.line === item.position.start.line)  ?. link || cache.links ?. find((link) => link.position.start.line === item.position.start.line) ?. link || "";
                            
                            items.push({
                                key: id,
                                pos: item.position,
                                ...item
                            });
                        }}
                );
                const sectionWithItems = {
                    items,
                    ...section
                };
                return sectionWithItems;
            }
            return section;
        }
    );
}

return cache.sections;}
