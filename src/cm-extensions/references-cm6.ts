import { EditorView, Decoration, MatchDecorator, ViewUpdate, ViewPlugin, DecorationSet, WidgetType} from "@codemirror/view";
import { editorInfoField } from "obsidian";
import { getSNWCacheByFile } from "src/indexer";
import { TransformedCachedItem } from "../types";
import { htmlDecorationForReferencesElement } from "./htmlDecorations";
import ThePlugin from "src/main";

let thePlugin: ThePlugin;

export function setPluginVariableForCM6InlineReferences(plugin: ThePlugin) {
    thePlugin = plugin;
}


/** 
 * Codemirror extension - hook into the CM editor
 * 
 * CM will call update as the doc updates. 
 * 
 */


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
        if(thePlugin.settings.enableRenderingLinksInLivePreview) 
            this.regxPattern += (this.regxPattern != "" ? "|" : "") +  "(?<=[^!]|^)\\[\\[(.*?)\\]\\]";
        if(thePlugin.settings.enableRenderingEmbedsInLivePreview)
            this.regxPattern += (this.regxPattern != "" ? "|" : "") +  "!\\[\\[(.*?)\\]\\]";  
        if(thePlugin.settings.enableRenderingHeadersInLivePreview)
            this.regxPattern += (this.regxPattern != "" ? "|" : "") +  "^#+\\s.+";
        
        //if there is no regex pattern, then don't go further
        if(this.regxPattern==="") return;

        this.decorator = new MatchDecorator({
            regexp: new RegExp(this.regxPattern, "g"),
            decorate: (add, from, to, match, view) => {         
                const mdView = view.state.field( editorInfoField );
                const firstCharacterMatch = match[0].charAt(0);
                let refType = "";
                let key = "";
                const transformedCache = getSNWCacheByFile(mdView.file);               
                let transformedCachedItem: TransformedCachedItem[] = null;
                let wdgt: InlineReferenceWidget = null;

                if(firstCharacterMatch===" " && transformedCache?.blocks?.length>0) {
                    key = mdView.file.path.replace(".md","") + match[0].replace(" ^","#^"); //change this to match the references cache
                    transformedCachedItem = transformedCache.blocks;
                    refType = "block";
                } else if(firstCharacterMatch==="!" && transformedCache?.embeds?.length>0) { //embeds
                    key = match[0].replace("![[","").replace("]]","");
                    transformedCachedItem = transformedCache.embeds;
                    refType = "embed";
                } else if(firstCharacterMatch==="[" && transformedCache?.links?.length>0) { //link
                    key = match[0].replace("[[","").replace("]]","");
                    transformedCachedItem = transformedCache.links
                    refType = "link";
                } else if(firstCharacterMatch==="#" && transformedCache?.headings?.length>0) { //link
                    // @ts-ignore
                    key = match[0].replaceAll("#","").substring(1);
                    transformedCachedItem = transformedCache.headings
                    refType = "heading";
                }
                
                if((refType==="embed" || refType==="link")  &&  key.contains("|")) // check for aliased references
                    key = key.substring(0, key.search(/\|/));
    
                if(key!="") {
                    wdgt = constructWidgetForInlineReference(refType, key, transformedCachedItem, mdView.file.path);
                    if(wdgt!=null)
                            add(to, to, Decoration.widget({widget: wdgt, side: 1}));    
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
            matchKey = ref.headerMatch; // headers require special comparison
            key = key.replace(/^\s+|\s+$/g,''); // should be not leading spaces
        }
        if(matchKey===key) {
            if(ref?.references.length>=thePlugin.settings.minimumRefCountThreshold)
                return new InlineReferenceWidget(ref.references.length, ref.type, ref.key, ref.references[0].resolvedFile.path.replace(".md",""), null, ref.pos.start.line);
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
    key: string;    //a unique identifer for the reference
    filePath: string;
    addCssClass: string; //if a reference need special treatment, this class can be assigned
    lineNu: number; //number of line within the file

    constructor(refCount: number, cssclass: string, key:string, filePath: string, addCSSClass: string, lineNu: number ) {
        super();
        this.referenceCount = refCount;
        this.referenceType = cssclass;
        this.key = key;
        this.filePath = filePath;
        this.addCssClass = addCSSClass;
        this.lineNu = lineNu;
    }

    // eq(other: InlineReferenceWidget) { 
    //     return other.referenceCount == this.referenceCount; 
    // }

    toDOM() {
        return htmlDecorationForReferencesElement(this.referenceCount, this.referenceType, this.key, this.filePath, this.addCssClass, this.lineNu);
    }

    destroy() {}

    ignoreEvent() { return false }
} // END InlineReferenceWidget