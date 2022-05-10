import {WidgetType, EditorView, Decoration} from "@codemirror/view";
import {ViewUpdate, ViewPlugin, DecorationSet} from "@codemirror/view";
import {Range, RangeSetBuilder} from "@codemirror/rangeset";
import {App, CachedMetadata, editorViewField, MarkdownView, Notice, Pos, TFile} from "obsidian";
import { getCurrentPage } from "src/indexer";


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

class InlineReferenceWidget extends WidgetType {
    referenceCount: number;
    positionInDocument: number;

    constructor(refCount: number, pos: number) {
        super();
        this.referenceCount = refCount;
        this.positionInDocument = pos;
    }

    // eq(other: InlineReferenceWidget) { 
    //     console.log("other", other.referenceCount, this.referenceCount)
    //     return other.referenceCount == this.referenceCount; 
    // }

    toDOM() {
        let wrap = document.createElement("span")
        wrap.className = "snw-inline-ref"
        wrap.innerText= this.referenceCount.toString(); 
        wrap.setAttribute("data-snw-pos", this.positionInDocument.toString());
        return wrap
    }

    destroy() {}

    ignoreEvent() { return false }
}

// function calclulateInlineReferences(view: EditorView, theApp: App, mdView: MarkdownView) {
//     let referenceLocations = new RangeSetBuilder<Decoration>();
//     if(mdView?.file===undefined) return referenceLocations.finish();
    
//     let referenceLocation = [];
    
//     const currentViewDocumentFilePath = mdView.file.path; //path of file current displayed in view
//     const visibleRanges = view.visibleRanges;

//     //@ts-ignore
//     const allLinks: Link[] = theApp.fileManager.getAllLinkResolutions();
//     // console.log("allLinks", allLinks)
//     const incomingFiles = allLinks.filter(f=>f.resolvedFile.path===currentViewDocumentFilePath);
//     // console.log("incomingFiles", incomingFiles)

//     const fileCache = app.metadataCache.getFileCache(mdView.file);
//     // console.log("fileCache", fileCache)
//     if(fileCache===null) return referenceLocations.finish();

//     if(fileCache.blocks) {
//         for (const [key, value] of Object.entries(fileCache.blocks)) {
//             // console.log(key, value, value.position)
//             const linkPath = value.path.replace(".md","") + "#^" + value.id;
//             const blocks = allLinks.filter((link:Link)=>link.reference.link===linkPath);
//             // console.log("rng", visibleRanges.filter(range=>{
//             //     console.log(range.from<=value.position.start.offset && range.to>=value.position.end.offset)
//             //     console.log(range.from, range.to, value.position.start.offset, value.position.end.offset)
//             // }))
//             if(blocks.length>0 && visibleRanges.filter(range=>range.from<=value.position.start.offset && range.to>=value.position.end.offset))  {
//                 referenceLocation.push({
//                     pos: value.position.end.offset, 
//                     count: blocks.length
//                 });                
//             }
//         } 
//     }

//     if(fileCache.headings) {
//         for (const [key, value] of Object.entries(fileCache.headings)) {
//             const linkPath = currentViewDocumentFilePath.replace(".md","") + "#" + value.heading;
//             const headings = allLinks.filter((link:Link)=>link.reference.link===linkPath);
//             if(headings.length>0 && visibleRanges.filter(range=>range.from<=value.position.start.offset && range.to>=value.position.end.offset))  {
//                 referenceLocation.push({
//                     pos: value.position.end.offset, 
//                     count: headings.length
//                 });                
//             }
//         }
//     }

//     if(fileCache.embeds) {
//         for (const [key, value] of Object.entries(fileCache.embeds)) {
//             const embeds = allLinks.filter((link:Link)=>link.reference.link===value.link);
//             if(embeds.length>0)  {
//                 referenceLocation.push({
//                     pos: value.position.end.offset, 
//                     count: embeds.length
//                 });                
//             }
//         }
//     }

//     if(fileCache.links) {
//         for (const [key, value] of Object.entries(fileCache.links)) {
//             const linkPath = currentViewDocumentFilePath.replace(".md","") + "#" + value.heading;
//             const links = allLinks.filter((link:Link)=>link.reference.link===value.link);
//             if(links.length>0)  {
//                 referenceLocation.push({
//                     pos: value.position.end.offset, 
//                     count: links.length
//                 });                
//             }
//         }
//     }

//     // console.log(referenceLocation)
//     referenceLocation.sort((a,b)=>a.pos-b.pos).forEach((r)=>{
//         referenceLocations.add(
//             r.pos, r.pos,
//             Decoration.widget({widget: new InlineReferenceWidget(r.count, r.pos), side: 1})
//         );        
//     });

//     return referenceLocations.finish(); 
// }

export enum fileCacheElementTypes {
    blocks = "blocks",
    headings = "headings",
    embeds  = "embeds",
    links = "links"
}

export interface fileCacheElements {
    type: fileCacheElementTypes,
    from: number,
    to: number,
    pathOrLink: string,
    original: string, //original text displayed
    blockID: string,
    references: any
}

function reduceDocElementsToRange(view: EditorView, elements: CachedMetadata, allLinks, currentViewDocumentFilePath:string): fileCacheElements[] {
    let results: fileCacheElements[] = [];
    if(elements.blocks) 
        for (const [key, value] of Object.entries(elements.blocks)) {
            const linkPath = value.path.replace(".md","") + "#^" + value.id;
            const blocks = allLinks.filter((link:Link)=>link.reference.link===linkPath);
            if(blocks.length>0)  {
                results.push({ type: fileCacheElementTypes.blocks, from: value.position.start.offset, to: value.position.end.offset, 
                             pathOrLink: value.path, original:"", blockID: value.id,
                             references: blocks });
            }    
        }

    if(elements.headings)
        for (const [key, value] of Object.entries(elements.headings)) {
            const linkPath = currentViewDocumentFilePath.replace(".md","") + "#" + value.heading;
            const headings = allLinks.filter((link:Link)=>link.reference.link===linkPath);
            if(headings.length>0) {
                results.push({ type: fileCacheElementTypes.headings, from: value.position.start.offset, to: value.position.end.offset, 
                    pathOrLink:  "#".repeat(value.level) + " " + value.heading, 
                    original: "",
                    blockID: "",
                    references: headings 
                });
            }
        }

    if(elements.embeds)
        for (const [key, value] of Object.entries(elements.embeds)) {
            if(results.findIndex(r=>r.pathOrLink===value.link)===-1) {
                const embeds = allLinks.filter((link:Link)=>link.reference.link===value.link);
                if(embeds.length>0)  {
                    results.push({ type: fileCacheElementTypes.embeds, from: value.position.start.offset, to: value.position.end.offset, 
                        pathOrLink: value.link, 
                        original: value.original,
                        blockID: "",
                        references: embeds 
                    });
                }
            }
        }

    if(elements.links)
        for (const [key, value] of Object.entries(elements.links)) {
            const linkPath = currentViewDocumentFilePath.replace(".md","") + "#" + value.heading;
            const links = allLinks.filter((link:Link)=>link.reference.link===value.link);
            if(links.length>0)  {
                results.push({ type: fileCacheElementTypes.links, from: value.position.start.offset, to: value.position.end.offset, 
                    pathOrLink: value.link,
                    original: value.original,
                    blockID: "",
                    references: links
                });
            }            
        }


    return results.sort((a,b)=>a.type-b.type);
}


function calclulateInlineReferences(view: EditorView, theApp: App, mdView: MarkdownView) {
    let referenceLocations = new RangeSetBuilder<Decoration>();
        if(mdView?.file===undefined) return referenceLocations.finish();

    let referenceLocation = [];

    const currentViewDocumentFilePath = mdView.file.path; //path of file current displayed in view


    const allLinks: Link[] = theApp.fileManager.getAllLinkResolutions();
    // console.log("allLinks", allLinks)
    //const incomingFiles = allLinks.filter(f=>f.resolvedFile.path===currentViewDocumentFilePath);
    // console.log("incomingFiles", incomingFiles)

    const fileCache = app.metadataCache.getFileCache(mdView.file);
    if(fileCache===null) return referenceLocations.finish();

    const cp = getCurrentPage({ file: mdView.file, app });
    console.log("cp", cp) 
    
    // console.clear()
    
    const fileElementsToDisplay: fileCacheElements[] = reduceDocElementsToRange(view, fileCache, allLinks, currentViewDocumentFilePath);
    console.log(fileElementsToDisplay)
    const viewPort = view.viewport;

    // walk through the elements of the document (blocks, headings, embeds, links) and test each line to see if it contains
    // something that should be featured in the editor
    let currentLocationInDocument = 0;

    view.state.doc.children.forEach((child)=>{
        //iterate over each line of text
        child.text.forEach((t:string)=> {
            if(viewPort.to>=currentLocationInDocument && viewPort.from<=currentLocationInDocument) {
                fileElementsToDisplay.forEach((element)=>{
                    // if(element.from<=currentLocationInDocument && element.to>=currentLocationInDocument) {
                        if(element.type===fileCacheElementTypes.blocks && t.endsWith(` ^${element.blockID}`)) {
                            const posInDoc = currentLocationInDocument + t.length;
                            referenceLocation.push({pos: posInDoc, count: 1});     
                        }
                        if(element.type===fileCacheElementTypes.headings && t===element.pathOrLink) {
                            const posInDoc = currentLocationInDocument + t.length;
                            referenceLocation.push({pos: posInDoc, count: 1});     
                        }
                        if(element.type===fileCacheElementTypes.embeds)  {
                            const locationOfEmbed = t.indexOf(element.original);
                            if(locationOfEmbed>=0) {
                                const posInDoc = currentLocationInDocument + locationOfEmbed + element.original.length;
                                referenceLocation.push({pos: posInDoc, count: 1});     
                            }
                        }
                        if(element.type===fileCacheElementTypes.links)  {
                            const locationOfLink = t.indexOf(element.original);
                            if(locationOfLink>=0) {
                                const posInDoc = currentLocationInDocument + locationOfLink + element.original.length;
                                referenceLocation.push({pos: posInDoc, count: 1});
                            }
                        }
                    // }
                });
            }
            currentLocationInDocument += t.length + 1;
        });
    });
    
    // console.log("filecache", fileCache)

    // console.log("fileElementsToDisplay", fileElementsToDisplay)


    // console.log(referenceLocation)
    referenceLocation.sort((a,b)=>a.pos-b.pos).forEach((r)=>{
        referenceLocations.add(
            r.pos, r.pos,
            Decoration.widget({widget: new InlineReferenceWidget(r.count, r.pos), side: 1})
        );        
    });

    return referenceLocations.finish(); 
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