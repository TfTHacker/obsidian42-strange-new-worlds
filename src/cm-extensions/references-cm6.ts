import { EditorView, Decoration, MatchDecorator, ViewUpdate, ViewPlugin, DecorationSet, WidgetType} from "@codemirror/view";
import { editorInfoField } from "obsidian";
import { getCurrentPage } from "src/indexer";
import { generateArialLabel } from "./references-preview";
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
                let key = "";
                const transformedCache = getCurrentPage(mdView.file);               
                let transformedCachedItem: TransformedCachedItem[] = null;
                let wdgt: InlineReferenceWidget = null;

                if(firstCharacterMatch===" " && transformedCache?.blocks?.length>0) {
                    key = match[0].replace(" ^","");
                    transformedCachedItem = transformedCache.blocks;
                } else if(firstCharacterMatch==="!" && transformedCache?.embeds?.length>0) { //embeds
                    key = match[0].replace("![[","").replace("]]","");
                    transformedCachedItem = transformedCache.embeds;
                } else if(firstCharacterMatch==="[" && transformedCache?.links?.length>0) { //link
                    key = match[0].replace("[[","").replace("]]","");
                    transformedCachedItem = transformedCache.links
                } else if(firstCharacterMatch==="#" && transformedCache?.headings?.length>0) { //link
                    // @ts-ignore
                    key = match[0].replaceAll("#","").substring(1);
                    transformedCachedItem = transformedCache.headings
                }
                if(key!="") {
                    wdgt = constructWidgetForInlineReference(key, transformedCachedItem, mdView.file.path);
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
const constructWidgetForInlineReference = (key: string, references: TransformedCachedItem[], filePath: string): InlineReferenceWidget => {
    for (let i = 0; i < references.length; i++) {
        const ref = references[i];
        if(ref.keyFullPath===key)
            if(ref?.references.length>0)
                return new InlineReferenceWidget(ref.references.length, ref.type, ref.key, ref.references[0].reference.link, generateArialLabel(filePath, ref), null);
            else
                return null;
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
    link: string;
    arialLabel: string;
    addCssClass: string; //if a reference need special treatment, this class can be assigned

    constructor(refCount: number, cssclass: string, key:string, link: string, arialLabel: string, addCSSClass: string ) {
        super();
        this.referenceCount = refCount;
        this.referenceType = cssclass;
        this.key = key;
        this.link = link;
        this.arialLabel = arialLabel;
        this.addCssClass = addCSSClass;
    }

    // eq(other: InlineReferenceWidget) { 
    //     return other.referenceCount == this.referenceCount; 
    // }

    toDOM() {
        return htmlDecorationForReferencesElement(this.referenceCount, this.referenceType, this.key, this.link, this.arialLabel, this.addCssClass);
    }

    destroy() {}

    ignoreEvent() { return false }
} // END InlineReferenceWidget