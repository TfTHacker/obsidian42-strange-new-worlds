import {WidgetType, EditorView, Decoration} from "@codemirror/view";
import {ViewUpdate, ViewPlugin, DecorationSet} from "@codemirror/view";
import {RangeSetBuilder} from "@codemirror/state";
import {App, editorInfoField, MarkdownFileInfo, } from "obsidian";
import {getCurrentPage} from "src/indexer";
import ThePlugin from "../main";
import {ReferenceLocation, TransformedCachedItem} from "../types";
import {htmlDecorationForReferencesElement} from "../htmlDecorations";
import {generateArialLabel} from "./references-preview";

let thePlugin: ThePlugin;

export function setPluginVariableForCM6(plugin: ThePlugin) {
    thePlugin = plugin;
}

/** 
 * Codemirror extension - hook into the CM editor
 * 
 * CM will call update as the doc updates. 
 * 
 * calclulateInlineReferences is the key. It finds the references in the file and then returns
 * the info needed by CM to process and display found matches
 */
const InlineReferenceExtension = ViewPlugin.fromClass(class {
    app: App;
    mdView: MarkdownFileInfo
    decorations : DecorationSet;

    constructor(view: EditorView) { 
        this.mdView = view.state.field( editorInfoField )
        this.app = this.mdView.app;
        this.decorations = calclulateInlineReferences(view, this.app, this.mdView);

        if(thePlugin.snwAPI.enableDebugging?.CM6Extension) 
            thePlugin.snwAPI.console("InlineReferenceExtension constructor(EditorView)", view)

    }    

    update(update : ViewUpdate) { 
        if (update.docChanged || update.viewportChanged)  {
            this.decorations = calclulateInlineReferences(update.view, this.app, this.mdView);
            if(thePlugin.snwAPI.enableDebugging?.CM6Extension) 
               thePlugin.snwAPI.console("InlineReferenceExtension update(ViewUpdate, deocrations)", update, this.decorations)
        }
    }
}, {
    decorations: v => v.decorations  
}) // END InlineReferenceExtension



/**
 * CM widget for renderinged matched ranges of references. This allows us to provide our UX for matches.
 *
 * @class InlineReferenceWidget
 * @extends {WidgetType}
 */
class InlineReferenceWidget extends WidgetType {
    referenceCount: number;
    referenceType: string;
    key: string;    //a unique identifer for the reference
    link: string;
    arialLabel: string;
    addCssClass: string; //if a reference need special treatment, this class can be assigned
    thePlugin: ThePlugin;

    constructor(refCount: number, cssclass: string, key:string, link: string, arialLabel: string, addCSSClass: string ) {
        super();
        this.referenceCount = refCount;
        this.referenceType = cssclass;
        this.key = key;
        this.link = link;
        this.arialLabel = arialLabel;
        this.addCssClass = addCSSClass;
    }

    eq(other: InlineReferenceWidget) { 
        return other.referenceCount == this.referenceCount; 
    }

    toDOM() {
        return htmlDecorationForReferencesElement(this.referenceCount, this.referenceType, this.key, this.link, this.arialLabel, this.addCssClass);
    }

    destroy() {}

    ignoreEvent() { return false }
} // END InlineReferenceWidget


/**
 * Welcome to the crown jewels.
 * 
 * Locates inline references, and tells CM editor where they are, 
 * and provides additional meta data for later use through out the plugin
 *
 * @param {EditorView} view
 * @param {App} theApp
 * @param {MarkdownFileInfo} mdView
 * @return {*} 
 */
function calclulateInlineReferences(view: EditorView, theApp: App, mdView: MarkdownFileInfo) {
    if(thePlugin.snwAPI.enableDebugging?.CM6Extension) 
        thePlugin.snwAPI.console("calclulateInlineReferences(EditorView, theApp, MarkdownFileInfo", view,theApp,mdView);
    
    const rangeSetBuilder = new RangeSetBuilder<Decoration>();
    if(mdView?.file===undefined) return rangeSetBuilder.finish();

    const CurrentFile = mdView.file.path;
    const referenceLocations: ReferenceLocation[] = [];
    const transformedCache = getCurrentPage(mdView.file, theApp);
    const viewPort = view.viewport; 

    const processReferences = (references: TransformedCachedItem[]) => {
        references.forEach(ref=>{
            if( ref.references.length > 1 && (viewPort.from <= ref.pos.start.offset && viewPort.to >= ref.pos.end.offset) ) {
                referenceLocations.push({
                    type: ref.type,
                    count: ref.references.length,
                    pos: ref.pos.end.offset, 
                    key: ref.key,
                    link: ref.references[0].reference.link,
                    arialLabel: generateArialLabel(CurrentFile, ref),
                    attachClass: null
                });
            }
        });
    }

    if(transformedCache.blocks)     processReferences(transformedCache.blocks);
    if(transformedCache.embeds)     processReferences(transformedCache.embeds);
    if(transformedCache.headings)   processReferences(transformedCache.headings);
    if(transformedCache.links)      processReferences(transformedCache.links);

    referenceLocations.sort((a,b)=>a.pos-b.pos).forEach((r)=>{
        rangeSetBuilder.add(
            r.pos, r.pos,
            Decoration.widget({widget: new InlineReferenceWidget(r.count, r.type, r.key, r.link, r.arialLabel, r.attachClass), side: 1})
        );        
    });

    if(thePlugin.snwAPI.enableDebugging?.CM6Extension) 
        thePlugin.snwAPI.console("calclulateInlineReferences - referenceLocations", referenceLocations)

    return rangeSetBuilder.finish(); 

} // END calclulateInlineReferences


export default InlineReferenceExtension;