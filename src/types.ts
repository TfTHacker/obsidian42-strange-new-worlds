import { ListItemCache, Pos, SectionCache, TFile} from "obsidian";
declare module "obsidian" {
    interface FileManager {
        getAllLinkResolutions: () => Link[]
    }

    interface MetadataCache {
        metadataCache: {
            [x: string]: CachedMetadata
        }
        getLinks: () => {
            [key: string]: {
                link: string
                position: Pos
            }
        }
    }

    interface Vault {
        fileMap: {
            [x: string]: TFile
        }
    }
}

export interface ReferenceLocation {
    type: "block" | "heading" | "embed" | "link" | string;
    pos: number;
    count: number;
    key: string; //identifier for the reference
    link: string; // full link to reference
    arialLabel: string; 
    attachClass: string; // allows a custom class to be attached when processing cm6 references
} 

export interface Link {
    reference: {
        link: string
        displayText: string
        position: Pos
    }
    resolvedFile: TFile
    resolvedPaths: string[]
    sourceFile: TFile 
}

export interface TransformedCachedItem {
    key: string
    pos: Pos
    page: string
    type: string
    references: Link[]
    original?: string 
}

export interface TransformedCache {
    blocks?: TransformedCachedItem[]
    links?: TransformedCachedItem[]
    linksWithoutDuplicates?: TransformedCachedItem[]
    headings?: TransformedCachedItem[]
    embeds?: TransformedCachedItem[]
    embedsWithDuplicates?: TransformedCachedItem[]
    sections?: SectionCache[]
}
 
export interface ListItem extends ListItemCache {
    pos: number
    key: string
}

export interface Section {
    id?: string
    items?: ListItem[]
    position: Pos
    pos?: number
    type: string
}