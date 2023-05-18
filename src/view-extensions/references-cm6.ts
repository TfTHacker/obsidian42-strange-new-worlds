/** 
 * Codemirror extension - hook into the CM editor
 * 
 * CM will call update as the doc updates. 
 * 
 */

import { EditorView, Decoration, MatchDecorator, ViewUpdate, ViewPlugin, DecorationSet, WidgetType} from "@codemirror/view";
import { editorInfoField, stripHeading } from "obsidian";
import { getSNWCacheByFile, parseLinkTextToFullPath } from "src/indexer";
import { TransformedCachedItem } from "../types";
import { htmlDecorationForReferencesElement } from "./htmlDecorations";
import SNWPlugin from "src/main";

let thePlugin: SNWPlugin;

export function setPluginVariableForCM6InlineReferences(plugin: SNWPlugin) {
    thePlugin = plugin;
}

/**
 * CM widget for renderinged matched ranges of references. This allows us to provide our UX for matches.
 *
 * @class InlineReferenceWidget
 * @extends {WidgetType}
 */
export const InlineReferenceExtension = ViewPlugin.fromClass(class {

    decorator: MatchDecorator; 
    decorations: DecorationSet = Decoration.none;
    regxPattern = "";

    constructor(public view: EditorView) {        
        if(thePlugin.settings.enableRenderingBlockIdInLivePreview) 
            this.regxPattern = "(\\s\\^)(\\S+)$"; 
        if(thePlugin.settings.enableRenderingEmbedsInLivePreview)
            this.regxPattern += (this.regxPattern != "" ? "|" : "") +  "!\\[\\[(.*?)\\]\\]";  
        if(thePlugin.settings.enableRenderingLinksInLivePreview) 
                this.regxPattern += (this.regxPattern != "" ? "|" : "") +  "\\[\\[(.*?)\\]\\]";
        if(thePlugin.settings.enableRenderingHeadersInLivePreview)
            this.regxPattern += (this.regxPattern != "" ? "|" : "") +  "^#+\\s.+";

        //if there is no regex pattern, then don't go further
        if(this.regxPattern==="") return;

        this.decorator = new MatchDecorator({
            regexp: new RegExp(this.regxPattern, "g"),
            decorate: (add, from, to, match, view) => {         
                const mdView = view.state.field( editorInfoField );
                const firstCharacterMatch = match[0].charAt(0);
                const transformedCache = getSNWCacheByFile(mdView.file);  
                if(transformedCache?.cacheMetaData?.frontmatter?.["snw-file-exclude"]!=true && 
                   transformedCache?.cacheMetaData?.frontmatter?.["snw-canvas-exclude-edit"]!=true) {
                    const widgetsToAdd: {key: string, transformedCachedItem: TransformedCachedItem[], refType: string, from: number, to: number}[] = []
                    if(firstCharacterMatch===" " && transformedCache?.blocks?.length>0) {
                        widgetsToAdd.push({         //blocks
                            key: mdView.file.path.replace(".md","") + match[0].replace(" ^",""), //change this to match the references cache
                            transformedCachedItem: transformedCache.blocks,
                            refType: "block",
                            from: to,
                            to: to
                        });
                    } else if(firstCharacterMatch==="!" && transformedCache?.embeds?.length>0) { //embeds
                        let newEmbed =match[0].replace("![[","").replace("]]","");
                        if(newEmbed.startsWith("#")) //link to an internal page link, add page name
                            newEmbed = mdView.file.path.replace(".md","") + stripHeading(newEmbed);
                        widgetsToAdd.push({
                            key: newEmbed,
                            transformedCachedItem: transformedCache.embeds,
                            refType:"embed",
                            from: to,
                            to: to
                        });                                       
                    } else if(firstCharacterMatch==="[" && transformedCache?.links?.length>0) { //link
                        let newLink = match[0].replace("[[","").replace("]]","");
                        if(newLink.startsWith("#")) //link to an internal page link, add page name
                            newLink = mdView.file.path.replace(".md","") + newLink;
                        widgetsToAdd.push({
                            key: newLink,
                            transformedCachedItem: transformedCache.links,
                            refType: "link",
                            from: to,
                            to: to
                        });
                    } else if(firstCharacterMatch==="#" && transformedCache?.headings?.length>0) { //heading
                        widgetsToAdd.push({
                            // @ts-ignore
                            key: stripHeading(match[0].replace(/^#+/,"").substring(1)),
                            transformedCachedItem: transformedCache.headings,
                            refType: "heading",
                            from: to,
                            to: to 
                        });
                        if(thePlugin.settings.enableRenderingLinksInLivePreview)  {
                            // this was not working with mobile from 0.16.4 so had to convert it to a string
                            const linksinHeader = match[0].match(/\[\[(.*?)\]\]|!\[\[(.*?)\]\]/g);
                            if(linksinHeader)
                                for (const l of linksinHeader) {
                                    widgetsToAdd.push({
                                        key: l.replace("![[","").replace("[[","").replace("]]",""), //change this to match the references cache
                                        transformedCachedItem: l.startsWith("!") ? transformedCache.embeds : transformedCache.links,
                                        refType: "link",
                                        from: (to - match[0].length) + (match[0].indexOf(l) + l.length),
                                        to: (to - match[0].length) + (match[0].indexOf(l) + l.length)
                                    });
                                }                        
                        }
                    }

                    for (const ref of widgetsToAdd.sort((a,b)=>a.to-b.to) ) {
                        if(ref.key!="") {
                            const wdgt = constructWidgetForInlineReference(ref.refType, ref.key, ref.transformedCachedItem, mdView.file.path);
                            if(wdgt!=null) {
                                add(ref.from, ref.to, Decoration.widget({widget: wdgt, side: 1}));    
                            }
                        }
                    } // end for
                }
            },
        })

        if(this.regxPattern!="")
            this.decorations = this.decorator.createDeco(view);
    }

    update(update: ViewUpdate) {
        if ( this.regxPattern!="" && (update.docChanged || update.viewportChanged)  ) {
            this.decorations = this.decorator.updateDeco(update, this.decorations);
        }
    }

}, {
    decorations: v => v.decorations  
}) 


/**
 * Helper function for preparting the Widget for displaying the reference count
 *
 * @param {string} key  - Unique reference key
 * @param {TransformedCachedItem[]} references - list of references 
 * @param {string} filePath - file path for file being modified
 * @return {*}  {InlineReferenceWidget}
 */
const constructWidgetForInlineReference = (refType: string, key: string, references: TransformedCachedItem[], filePath: string): InlineReferenceWidget => {

    for (let i = 0; i < references.length; i++) {
        const ref = references[i];
        let matchKey = ref.key;
        if(refType==="heading") {
            matchKey = stripHeading(ref.headerMatch); // headers require special comparison
            key = key.replace(/^\s+|\s+$/g,''); // should be not leading spaces
        }

        if(refType==="embed" || refType==="link") {
            if(key.contains("|")) // check for aliased references
                key = key.substring(0, key.search(/\|/));
            const parsedKey = parseLinkTextToFullPath(key);     
            key = parsedKey==="" ? key : parsedKey; //if no results, likely a ghost link
            if(matchKey.startsWith("#")) { // internal page link
                matchKey = filePath.replace(".md","") + stripHeading(matchKey)
            }
        }

        if(matchKey===key) {
            const filePath = ref?.references[0]?.resolvedFile ? ref.references[0].resolvedFile.path.replace(".md","") : key;
            if( ref?.references[0]?.excludedFile!=true &&
                ref?.references.length>=thePlugin.settings.minimumRefCountThreshold)
                return new InlineReferenceWidget(ref.references.length, ref.type, ref.references[0].realLink, ref.key, filePath, null, ref.pos.start.line);
            else
                return null;
        }
    }
}


/**
 * CM widget for renderinged matched ranges of references. This allows us to provide our UX for matches.
 *
 * @class InlineReferenceWidget
 * @extends {WidgetType}
 */
 export class InlineReferenceWidget extends WidgetType {
    referenceCount: number;
    referenceType: string;
    realLink: string;
    key: string;    //a unique identifer for the reference
    filePath: string;
    addCssClass: string; //if a reference need special treatment, this class can be assigned
    lineNu: number; //number of line within the file

    constructor(refCount: number, cssclass: string, realLink:string, key:string, filePath: string, addCSSClass: string, lineNu: number ) {
        super();
        this.referenceCount = refCount;
        this.referenceType = cssclass;
        this.realLink = realLink;
        this.key = key;
        this.filePath = filePath;
        this.addCssClass = addCSSClass;
        this.lineNu = lineNu;
    }

    // eq(other: InlineReferenceWidget) { 
    //     return other.referenceCount == this.referenceCount; 
    // }

    toDOM() {
        return htmlDecorationForReferencesElement(this.referenceCount, this.referenceType, this.realLink, this.key, this.filePath, this.addCssClass, this.lineNu);
    }

    destroy() {}

    ignoreEvent() { return false }
} // END InlineReferenceWidget