import {CachedMetadata, ItemView, WorkspaceLeaf} from "obsidian";
import {getReferencesCache} from "./indexer";
import {Link} from "./types";
import ThePlugin from "./main";

export const VIEW_TYPE_SNW = "Strange New Worlds";

export class SidePaneView extends ItemView {
    contentEl: HTMLElement;
    thePlugin: ThePlugin;
    
    constructor(leaf : WorkspaceLeaf, thePlugin: ThePlugin) {
        super(leaf);
        this.thePlugin = thePlugin;
    }

    getViewType() { return VIEW_TYPE_SNW }

    getDisplayText() {
        return "Strange New Worlds";
    }

    async onOpen() {
        const container: HTMLElement = this.containerEl;
        container.empty();
        const key = this.thePlugin.lastSelectedReferenceKey;
        const refType = this.thePlugin.lastSelectedReferenceType;
        const link = this.thePlugin.lastSelectedReferenceLink;
        const filePath = this.thePlugin.app.workspace.activeLeaf.view.file.path;
        let sidePaneResourceTypeTitle = "" 
        let sidePaneReferencesTitle = "" 
        let lineNumberRefType = 0;
        let lineNumberResolvedFile = 0;

        let refCache: Link[] = [];
        
        switch (refType) {
            case "link":
                refCache = getReferencesCache()[key];
                sidePaneResourceTypeTitle   = "Link";
                sidePaneReferencesTitle     = "Backlinks";
                break;
            case "embed":
                sidePaneResourceTypeTitle   = "Embed";
                sidePaneReferencesTitle     = "Backlinks";
                refCache = getReferencesCache()[key];
                break;
            case "block":
                sidePaneResourceTypeTitle   = "Block";
                sidePaneReferencesTitle     = "Backlinks";
                refCache =  getReferencesCache()[link];
                if(refCache === undefined)
                refCache = getReferencesCache()[this.thePlugin.app.workspace.activeLeaf.view.file.basename + "#^" + key];            
                break;
            case "heading":
                sidePaneResourceTypeTitle   = "Heading";
                sidePaneReferencesTitle     = "Backlinks";
                refCache =  getReferencesCache()[link];
                break;
            case "File":
                sidePaneResourceTypeTitle   = "File";
                sidePaneReferencesTitle     = "Incoming links";
                Object.entries(getReferencesCache()).forEach((value, key)=>{ value[1].forEach((element:any) => { if(element.resolvedFile.path === link)  refCache.push(element)})});
                break;
            }

        //PANE HEADER
        let output = '<div class="snw-sidepane-container">';
        output = output + '<h1 class="snw-sidepane-header">' + sidePaneResourceTypeTitle + '</h1>';

        const findPositionInFile = (filePath:string, link: string) => {
            const cachedData: CachedMetadata = app.metadataCache.getCache(filePath);
            if(cachedData?.links) 
                for (const i of cachedData?.links) 
                    if(i.link===link) 
                        return i.position.start.line;

            if(cachedData?.embeds) 
                for (const i of cachedData?.embeds) 
                    if(i.link===link) 
                        return i.position.start.line;

            if(cachedData?.blocks) 
                for (const i of Object.entries(cachedData?.blocks)) 
                    if(i[1].id===link) 
                        return i[1].position.start.line;

            if(cachedData?.headings) {
                const headingLink = link.replace("#","");
                for (const i of cachedData.headings) 
                    if(i.heading===headingLink) 
                        return i.position.start.line;

            }
            return 0;
        }

        //REFERENCES TO THIS RESOURCE
        const sourceLink = refType === "File" ? link : refCache[0].resolvedFile.path;
        const sourceFileLineNumber = refType === "File" ? 0 : findPositionInFile(refCache[0].resolvedFile.path, refCache[0].reference.link.replace(refCache[0].resolvedFile.basename, "").replace("#^",""));
        output += `<a class="internal-link snw-sidepane-link" data-line-number="${sourceFileLineNumber}" data-href="${sourceLink}" href="${sourceLink}">${sourceLink.replace(".md","")}</a> `;
        output += `<h2 class="snw-sidepane-header-references-header">${sidePaneReferencesTitle}</h2>`;
        output += `<ul class="snw-sidepane-references">`;

        refCache.forEach(ref => {
                lineNumberRefType = findPositionInFile(ref.sourceFile.path, ref.reference.link);
                lineNumberResolvedFile = findPositionInFile(ref.resolvedFile.path, ref.reference.link.replace(ref.resolvedFile.basename,"").replace("#^",""));
                output += `<li class="snw-sidepane-reference-item">`;
                if(refType==="File") 
                    output += `<span class="snw-sidepane-reference-label-from">From: </span>`;
                output += `<a class="internal-link snw-sidepane-link snw-sidepane-reference-item-from" data-line-number="${lineNumberRefType}" data-href="${ref.sourceFile.path}" href="${ref.sourceFile.path}">${ref.sourceFile.basename}</a><br/>`;
                if(refType==="File") 
                    output += `<span class="snw-sidepane-reference-label-to">To: </span><a class="internal-link snw-sidepane-link snw-sidepane-reference-item-to" data-line-number="${lineNumberResolvedFile}" data-href="${ref.resolvedFile.path}" href="${ref.resolvedFile.path}">${ref.reference.link}</a>`;
                output += `</li>`;
                // if(filePath!=ref.sourceFile.path){ 
                // }
        })
        
        output += `</ul>`;
        output += `</div>`; //end of container

        container.innerHTML = output;

        setTimeout(() => {
            document.querySelectorAll('.snw-sidepane-link').forEach(el => {
                el.addEventListener('click', (e: PointerEvent) => {
                    e.preventDefault();
                    console.log("click",e)
                    const target = e.target as HTMLElement;
                    const filePath  = target.getAttribute("data-href");
                    const LineNu = Number(target.getAttribute("data-line-number"));
                    const fileT = app.metadataCache.getFirstLinkpathDest(filePath, filePath);
                    if(e.shiftKey)  
                        (app.workspace.splitActiveLeaf('horizontal')).openFile(fileT);
                    else if(e.ctrlKey)  
                        (app.workspace.splitActiveLeaf('vertical')).openFile(fileT);
                    else
                        this.thePlugin.app.workspace.activeLeaf.openFile(fileT);
                    if(LineNu!=0) {
                        setTimeout(() => {
                            this.thePlugin.app.workspace.activeLeaf.view.setEphemeralState({line: LineNu })
                        }, 500);
                    }
                })
            });    
        }, 200);
        
    }

    async onClose() { // Nothing to clean up.
    }
}
