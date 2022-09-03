import {WidgetType, EditorView, Decoration} from "@codemirror/view";
import {ViewUpdate, ViewPlugin, DecorationSet} from "@codemirror/view";
import {RangeSetBuilder} from "@codemirror/state";
import {App, editorViewField, MarkdownView} from "obsidian";
import {getCurrentPage } from "src/indexer";
import ThePlugin from "./main";
import {ReferenceLocation} from "./types";
import {htmlDecorationForReferencesElement} from "./htmlDecorations";
import { generateArialLabel } from "./references-preview";

let thePlugin: ThePlugin;

export function setPluginVariableForCM6(plugin: ThePlugin) {
    thePlugin = plugin;
}

const InlineReferenceExtension = ViewPlugin.fromClass(class {
    app: App;
    mdView: MarkdownView;
    decorations : DecorationSet;

    constructor(view: EditorView) { 
        this.mdView = view.state.field(editorViewField);
        this.app = this.mdView.app;
        this.decorations = calclulateInlineReferences(view, this.app, this.mdView)
    }    

    update(update : ViewUpdate) { 
        if (update.docChanged || update.viewportChanged) 
            this.decorations = calclulateInlineReferences(update.view, this.app, this.mdView)
    }
}, {
    decorations: v => v.decorations
})


class InlineReferenceWidget extends WidgetType {
    referenceCount: number;
    referenceType: string;
    key: string;    //a unique identifer for the reference
    link: string;
    arialLabel: string;
    thePlugin: ThePlugin;

    constructor(refCount: number, cssclass: string, key:string, link: string, arialLabel: string) {
        super();
        this.referenceCount = refCount;
        this.referenceType = cssclass;
        this.key = key;
        this.link = link;
        this.arialLabel = arialLabel;
    }

    eq(other: InlineReferenceWidget) { 
        return other.referenceCount == this.referenceCount; 
    }

    toDOM() {
        return htmlDecorationForReferencesElement(thePlugin, this.referenceCount, this.referenceType, this.key, this.link, this.arialLabel);
    }

    destroy() {}

    ignoreEvent() { return false }
}

function matchAll(source: string, find: string) {
    const result = [];
    for(let i=0;i<source.length; ++i) 
      if (source.substring(i, i + find.length) == find) 
        result.push(i);
    return result;
  }
 
function calclulateInlineReferences(view: EditorView, theApp: App, mdView: MarkdownView) {
    const rangeSetBuilder = new RangeSetBuilder<Decoration>();
    if(mdView?.file===undefined) return rangeSetBuilder.finish();

    const CurrentFile = mdView.file.path;
    const referenceLocations: ReferenceLocation[] = [];
    const transformedCache = getCurrentPage(mdView.file, theApp);
    const viewPort = view.viewport; 

    // walk through the elements of the document (blocks, headings, embeds, links) and test each line to see if it contains
    // something that should be featured in the editor

    let currentLocationInDocument = 0; 

    const processBlocks = (t:string)=> {
        if(viewPort.to>=currentLocationInDocument && viewPort.from<=currentLocationInDocument) {
            if(transformedCache.blocks) 
                for (const value of transformedCache.blocks) 
                    if(value.references.length>0 && t.endsWith(` ^${value.key}`)) {
                        referenceLocations.push({type:"block", pos: value.pos.end.offset, count: value.references.length, 
                                                key: value.key, link: value.references[0].reference.link, 
                                                arialLabel: generateArialLabel(CurrentFile, value)}
                                                ); 
                        break;
                    }
                    
            if(transformedCache.headings) 
                for (const value of transformedCache.headings) 
                    if(value.references.length>1 && t===value.original) {
                        referenceLocations.push({type:"heading", pos: currentLocationInDocument + t.length, count: value.references.length, 
                                                key: value.original, link: value.references[0].reference.link,
                                                arialLabel: generateArialLabel(CurrentFile, value)});   
                        break;
                    }

            if(transformedCache.embeds)
                for (const value of transformedCache.embedsWithDuplicates) 
                    if(value.references.length>1) 
                        matchAll(t, value.key).forEach(match=>
                            referenceLocations.push({ type:"embed", count: value.references.length-1,
                                                      pos: currentLocationInDocument + match + value.key.length +2, key: value.key, 
                                                      link: value.references[0].reference.link,
                                                      arialLabel: generateArialLabel(CurrentFile, value)}
                                                    ));

            if(transformedCache.linksWithoutDuplicates)
                for (const value of transformedCache.linksWithoutDuplicates) 
                    if(value.references.length>1) 
                        matchAll(t, value.key).forEach(match=>
                            referenceLocations.push({ type:"link", count: value.references.length-1,
                                                        pos: currentLocationInDocument + match + value.key.length, key: value.key, 
                                                        link: value.references[0].reference.link,
                                                        arialLabel: generateArialLabel(CurrentFile, value)
                                                    }));
        }
    }

    if(view.state.doc.children) {
        view.state.doc.children.forEach((child)=>{
            child.text.forEach((t:string)=> {
                processBlocks(t);
                currentLocationInDocument += t.length + 1;
            });
        });
    } else {
        view.state.doc.text.forEach((t:string)=> {
            processBlocks(t);
            currentLocationInDocument += t.length + 1;
        });
    }
    
    referenceLocations.sort((a,b)=>a.pos-b.pos).forEach((r)=>{
        rangeSetBuilder.add(
            r.pos, r.pos,
            Decoration.widget({widget: new InlineReferenceWidget(r.count, r.type, r.key, r.link, r.arialLabel), side: 1})
        );        
    });

    return rangeSetBuilder.finish(); 
}


export default InlineReferenceExtension;