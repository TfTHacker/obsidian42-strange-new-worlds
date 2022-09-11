import {CachedMetadata, ItemView, WorkspaceLeaf} from "obsidian";
import {getReferencesCache} from "./indexer";
import {Link} from "./types";
import ThePlugin from "./main";

export const VIEW_TYPE_SNW = "Strange New Worlds";


const findPositionInFile = (filePath:string, link: string): number => {

    console.log("findposition infile", filePath, link)

    const cachedData: CachedMetadata = app.metadataCache.getCache(filePath);
    if(cachedData?.links) {
        for (const i of cachedData.links) {
            if(i.link===link) 
                return i.position.start.line;
        }
    }

    if(cachedData?.embeds) {
        for (const i of cachedData.embeds) 
            if(i.link===link) 
                return i.position.start.line;
    }

    if(cachedData?.blocks) {
        for (const i of Object.entries(cachedData?.blocks)) 
            if(i[1].id===link) 
                return i[1].position.start.line;
    }

    if(cachedData?.headings) {
        const headingLink = link.replace("#","");
        for (const i of cachedData.headings) 
            if(i.heading===headingLink) 
                return i.position.start.line;
    }
    
    return 0;  
}

export class SidePaneView extends ItemView {
    contentEl: HTMLElement;
    thePlugin: ThePlugin;
    
    constructor(leaf : WorkspaceLeaf, thePlugin: ThePlugin) {
        super(leaf);
        this.thePlugin = thePlugin;
    }

    getViewType() { return VIEW_TYPE_SNW }

    getDisplayText() { return "Strange New Worlds"}

    getIcon() { return "dot-network" }

    async onOpen() {
        const container: HTMLElement = this.containerEl;
        container.empty();
        container.innerHTML = `<span class="snw-sidepane-loading">Discovering new worlds...</span>`;
        const key = this.thePlugin.lastSelectedReferenceKey;
        const refType = this.thePlugin.lastSelectedReferenceType;
        const link = this.thePlugin.lastSelectedReferenceLink;

        console.log(`------------------ sidepane opened with.` )
        console.log("key",key)
        console.log("refType", refType)
        console.log("link", link)

        // const filePath = this.thePlugin.app.workspace.activeLeaf.view.file.path;
        let sidePaneResourceTypeTitle = "" 
        let sidePaneReferencesTitle = "" 
        let lineNumberRefType = 0;

        let refCache: Link[] = [];
        let hoverLinkUrl = ""; //used by hover popup to control the reference used
        
        switch (refType) {
            case "link":
                refCache = getReferencesCache()[key];
                sidePaneResourceTypeTitle   = "Target:";
                sidePaneReferencesTitle     = "Backlinks";
                break;
            case "embed":
                sidePaneResourceTypeTitle   = "Target:";
                sidePaneReferencesTitle     = "Backlinks";
                refCache = getReferencesCache()[key];
                break;
            case "block":
                sidePaneResourceTypeTitle   = "Target:";
                sidePaneReferencesTitle     = "Backlinks";
                refCache =  getReferencesCache()[link];
                if(refCache === undefined)
                refCache = getReferencesCache()[this.thePlugin.app.workspace.activeLeaf.view.file.basename + "#^" + key];            
                break;
            case "heading":
                sidePaneResourceTypeTitle   = "Target:";
                sidePaneReferencesTitle     = "Backlinks";
                refCache =  getReferencesCache()[link];
                break;
            case "File":
                sidePaneResourceTypeTitle   = "Target:";
                sidePaneReferencesTitle     = "Incoming links";
                Object.entries(getReferencesCache()).forEach((value, key)=>{ value[1].forEach((element:Link[]) => { if(element.resolvedFile.path === link)  refCache.push(element)})});
                break;
            } 

        window.snwAPI.console("refCache", refCache)

        //PANE HEADER 
        let output = '<div class="snw-sidepane-container">'; 
        output = output + '<div class="snw-sidepane-header">' + sidePaneResourceTypeTitle + '</div>';

        //REFERENCES TO THIS RESOURCE
        const sourceLink =  refType === "File" ? link : refCache[0]?.resolvedFile.path;
        const sourceFileLineNumber = refType === "File" ? 0 : findPositionInFile(refCache[0].resolvedFile.path, refCache[0].reference.link.replace(refCache[0].resolvedFile.basename, "").replace("#^",""));
        output += `<a class="internal-link snw-sidepane-link" 
                      snw-data-line-number="${sourceFileLineNumber}" 
                      snw-data-file-name="${sourceLink}"
                      data-href="${link}">${link.replace(".md","")}</a> `;
        
        // Display type of link
        output += `<div class="snw-sidepane-header-references-header">${sidePaneReferencesTitle}</div>`;
        
        //Loop through references and list them out
        output += `<ul class="snw-sidepane-references">`;
        refCache.forEach(ref => {
            // if(filePath!=ref.sourceFile.path){ 
            // }
            lineNumberRefType = findPositionInFile(ref.sourceFile.path, ref.reference.link);
            output += `<li class="snw-sidepane-reference-item">`;
            if(refType==="File") 
            output += `<span class="snw-sidepane-reference-label-from">From: </span>`;
            output += `<a class="internal-link snw-sidepane-link snw-sidepane-reference-item-from" 
                          snw-data-line-number="${lineNumberRefType}" 
                          snw-data-file-name="${ref.sourceFile.path}"
                          data-href="${ref.sourceFile.path}" 
                          href="${ref.sourceFile.path}">${ref.sourceFile.basename}</a><br/>`;
            if(refType==="File") {
                const lineNumberResolvedFile = findPositionInFile(ref.resolvedFile.path, ref.reference.link.replace(ref.resolvedFile.basename,"").replace("#^",""));
                output += `<span class="snw-sidepane-reference-label-to">To: </span>
                            <a class="internal-link snw-sidepane-link snw-sidepane-reference-item-to" 
                            snw-data-line-number="${lineNumberResolvedFile}" 
                            snw-data-file-name="${ref.resolvedFile.path}"
                            data-href="${ref.resolvedFile.path}" 
                            href="${ref.resolvedFile.path}">${ref.reference.link}</a>`;
            }
            output += `</li>`;
        }) 
        
        output += `</ul>`;
        output += `</div>`; //end of container

        container.innerHTML = output;

        setTimeout(() => {
            document.querySelectorAll('.snw-sidepane-link').forEach(el => {
                el.addEventListener('click', (e: PointerEvent) => {
                    console.log('hi')
                    e.preventDefault(); 
                    const target = e.target as HTMLElement;
                    const filePath  = target.getAttribute("snw-data-file-name");
                    const LineNu = Number(target.getAttribute("snw-data-line-number"));
                    console.log("filepath", filePath)
                    const fileT = app.metadataCache.getFirstLinkpathDest(filePath, filePath);
                    if(e.shiftKey)  
                        this.thePlugin.app.workspace.getLeaf("split", "vertical").openFile(fileT);
                    else if(e.ctrlKey || e.metaKey)  
                        this.thePlugin.app.workspace.getLeaf("window").openFile(fileT);
                    else if(e.altKey)
                        this.thePlugin.app.workspace.getLeaf("split", "horizontal").openFile(fileT);
                    else {
                        this.thePlugin.app.workspace.getLeaf(false).openFile(fileT);
                    }
                    if(LineNu!=0) {
                        setTimeout(() => {
                            this.thePlugin.app.workspace.activeLeaf.view.setEphemeralState({line: LineNu })
                        }, 100);
                    }
                });
                el.addEventListener('mouseover', (e: PointerEvent) => {
                    const target = e.target as HTMLElement;
                    const filePath  = target.getAttribute("data-href");
                    console.log(filePath)
                    app.workspace.trigger("hover-link", {
                        event: e,
                        source: 'source',
                        hoverParent: document.querySelector(".markdown-preview-view"),
                        targetEl: null,
                        linktext:  filePath,
                     });                    
                });                
            });    
        }, 500);
        
    }

    async onClose() { // Nothing to clean up.
    }
}
