import {WidgetType, EditorView, Decoration} from "@codemirror/view";
import {ViewUpdate, ViewPlugin, DecorationSet} from "@codemirror/view";
import {RangeSetBuilder} from "@codemirror/rangeset";
import {App, editorViewField, MarkdownView, Notice, Pos, TFile} from "obsidian";
import {getCurrentPage } from "src/indexer";
import {TransformedCachedItem} from "../types";

class InlineReferenceWidget extends WidgetType {
    referenceCount: number;
    cssclass: string;

    constructor(refCount: number, cssclass: string) {
        super();
        this.referenceCount = refCount;
        this.cssclass = cssclass;
    }

    // eq(other: InlineReferenceWidget) { 
    //     console.log("other", other.referenceCount, this.referenceCount)
    //     return other.referenceCount == this.referenceCount; 
    // }

    toDOM() {
        let wrap = document.createElement("span")
        wrap.className = "snw-reference snw-" + this.cssclass;
        wrap.innerText= this.referenceCount.toString(); 
        // wrap.setAttribute("data-snw-pos", this.positionInDocument.toString());
        return wrap
    }

    destroy() {}

    ignoreEvent() { return false }
}

interface referenceLocation {
    type: "block" | "heading" | "embed" | "link";
    pos: number;
    count: number;
}

function matchAll(source: string, find: string) {
    var result = [];
    for(let i:number=0;i<source.length; ++i) 
      if (source.substring(i, i + find.length) == find) 
        result.push(i);
    return result;
  }

 
function calclulateInlineReferences(view: EditorView, theApp: App, mdView: MarkdownView) {
    let rangeSetBuilder = new RangeSetBuilder<Decoration>();
    if(mdView?.file===undefined) return rangeSetBuilder.finish();

    let referenceLocations: referenceLocation[] = [];

    // const allLinks: Link[] = theApp.fileManager.getAllLinkResolutions();
    //const incomingFiles = allLinks.filter(f=>f.resolvedFile.path===currentViewDocumentFilePath);
    // console.log("incomingFiles", incomingFiles)

    const transformedCache = getCurrentPage({ file: mdView.file, app });
    
    const viewPort = view.viewport; 

    // walk through the elements of the document (blocks, headings, embeds, links) and test each line to see if it contains
    // something that should be featured in the editor

    let currentLocationInDocument = 0; 


    const processBlocks = (t:string)=> {
        if(viewPort.to>=currentLocationInDocument && viewPort.from<=currentLocationInDocument) {
            if(transformedCache.blocks) 
                for (const value of transformedCache.blocks) 
                    if(value.references.length>0 && t.endsWith(` ^${value.key}`)) {
                        referenceLocations.push({type:"block", pos: value.pos.end.offset, count: value.references.length});     
                        break;
                    }

            if(transformedCache.headings) 
                for (const value of transformedCache.headings) 
                    if(value.references.length>0 && t===value.original) {
                        referenceLocations.push({type:"heading", pos: currentLocationInDocument + t.length, count: value.references.length});   
                        break;
                    }

            if(transformedCache.embeds)
                for (const value of transformedCache.embedsWithDuplicates) 
                    if(value.references.length>0) 
                        matchAll(t, value.key).forEach(match=>
                            referenceLocations.push({ type:"embed", count: value.references.length,
                                                      pos: currentLocationInDocument + match + value.key.length +2})
                        )

            if(transformedCache.linksWithoutDuplicates)
                for (const value of transformedCache.linksWithoutDuplicates) 
                    if(value.references.length>0) 
                        matchAll(t, value.key).forEach(match=>
                            referenceLocations.push({ type:"link", count: value.references.length,
                                                        pos: currentLocationInDocument + match + value.key.length})
                        )
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
    
    // console.log(referenceLocations)
    referenceLocations.sort((a,b)=>a.pos-b.pos).forEach((r)=>{
        rangeSetBuilder.add(
            r.pos, r.pos,
            Decoration.widget({widget: new InlineReferenceWidget(r.count, r.type), side: 1})
        );        
    });

    return rangeSetBuilder.finish(); 
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
        // if (update.docChanged || update.viewportChanged) 
            this.decorations = calclulateInlineReferences(update.view, this.app, this.mdView)
    }
}, {
    decorations: v => v.decorations,
    eventHandlers: {
        mousedown: (e, view) => {
            let target = (e.target as HTMLElement).closest(".snw-inline-ref");
            if(target) {
                console.log("click", target)
                new Notice("click   ")
            }   
        }
    }
})

export default InlineReferenceExtension;