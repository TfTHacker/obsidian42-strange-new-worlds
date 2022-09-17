// Sidepane used by SNW for displaying references

import {CachedMetadata, ItemView, MarkdownView, WorkspaceLeaf} from "obsidian";
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

    getDisplayText() { return "Strange New Worlds"}

    getIcon() { return "dot-network" }

    async onOpen() {
        const container: HTMLElement = this.containerEl;
        container.empty();
        container.innerHTML = `<span class="snw-sidepane-loading">Discovering new worlds...</span>`;
        const key = this.thePlugin.lastSelectedReferenceKey;
        const refType = this.thePlugin.lastSelectedReferenceType;
        const link = this.thePlugin.lastSelectedReferenceLink;

        if(this.thePlugin.snwAPI.enableDebugging.SidePane) {
            this.thePlugin.snwAPI.console("sidepane.open() key, refType, link", key, refType,link);
            this.thePlugin.snwAPI.console("sidepane.open() getReferencesCache()", getReferencesCache());
        }

        // const filePath = this.thePlugin.app.workspace.activeLeaf.view.file.path;
        let sidePaneResourceTypeTitle = "" 
        let sidePaneReferencesTitle = "" 

        let refCache: Link[] = [];
        
        switch (refType) {
            case "link":
                refCache = getReferencesCache()[key];
                sidePaneResourceTypeTitle   = "Target:";
                sidePaneReferencesTitle     = "Backlinks to target:";
                break;
            case "embed":
                sidePaneResourceTypeTitle   = "Target:";
                sidePaneReferencesTitle     = "Backlinks to target:";
                refCache = getReferencesCache()[key];
                break;
            case "block":
                sidePaneResourceTypeTitle   = "Target:";
                sidePaneReferencesTitle     = "Backlinks to target:";
                refCache =  getReferencesCache()[link];
                if(refCache === undefined) refCache = getReferencesCache()[this.thePlugin.app.workspace.activeLeaf.view.file.basename + "#^" + key];            
                break;
            case "heading":
                sidePaneResourceTypeTitle   = "Target:";
                sidePaneReferencesTitle     = "Backlinks to target:";
                refCache =  getReferencesCache()[link];
                break;
            case "File":
                sidePaneResourceTypeTitle   = "Target:";
                sidePaneReferencesTitle     = "Incoming links:";
                Object.entries(getReferencesCache()).forEach((value, key)=>{ value[1].forEach((element:Link[]) => { if(element.resolvedFile.path === link)  refCache.push(element)})});
                break;
            } 

        if(refCache.length===0) return; //This may get callled when Obsidian initializes. So if there are no references, just exit

        //PANE HEADER 
        let output = '<div class="snw-sidepane-container">'; 
        output = output + '<div class="snw-sidepane-header">' + sidePaneResourceTypeTitle + '</div>';

        //REFERENCES TO THIS RESOURCE
        const sourceLink =  refType === "File" ? link : refCache[0]?.resolvedFile.path;
        // sourceFileLineNumber will be 0 when doing a header lookup, but if its a reference will goto the right line
        const sourceFileLineNumber = refType === "File" ? 0 : findPositionInFile(refCache[0].resolvedFile.path, refCache[0].reference.link.replace(refCache[0].resolvedFile.basename, "").replace("#^",""));
        output += `<a class="internal-link snw-sidepane-link" 
                      snw-data-line-number="${sourceFileLineNumber}" 
                      snw-data-file-name="${sourceLink}"
                      data-href="${link}">${link.replace(".md","")}</a> `;
        
        // Display type of link
        output += `<div class="snw-sidepane-header-references-header">${sidePaneReferencesTitle}</div>`;
        
        const sortedRefCache = refCache.sort((a,b)=>{
            return a.sourceFile.basename.localeCompare(b.sourceFile.basename) ||
                   Number(a.reference.position.start.line) - Number(b.reference.position.start.line);
        });

        //Loop through references and list them out
        output += `<ul class="snw-sidepane-references">`;
        sortedRefCache.forEach(ref => {
            const refLineNumber = this.thePlugin.settings.displayLineNumberInSidebar ? `<span class="snw-sidepane-linenumber">(${ref.reference.position.start.line+1})</span>` : "";
            output += `<li class="snw-sidepane-reference-item">`;
            if(refType==="File") output += `<span class="snw-sidepane-reference-label-from">From: </span>`;
            output += `<a class="internal-link snw-sidepane-link snw-sidepane-reference-item-from" 
                          snw-data-line-number="${ref.reference.position.start.line}" 
                          snw-data-file-name="${ref.sourceFile.path}"
                          data-href="${ref.sourceFile.path}" 
                          href="${ref.sourceFile.path}">${ref.sourceFile.basename}</a> ${refLineNumber}<br/>`;
            if(refType==="File") {
                console.log(ref)
                const lineNumberResolvedFile = findPositionInFile(ref.resolvedFile.path, ref.reference.link.replace(ref.resolvedFile.basename,"").replace("#^",""));
                output += `<span class="snw-sidepane-reference-label-to">To: </span>
                            <a class="internal-link snw-sidepane-link snw-sidepane-reference-item-to" 
                            snw-data-line-number="${lineNumberResolvedFile}" 
                            snw-data-file-name="${ref.resolvedFile.path}"
                            data-href="${ref.reference.link}" 
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
                    e.preventDefault(); 
                    const target = e.target as HTMLElement;
                    const filePath  = target.getAttribute("snw-data-file-name");
                    const LineNu = Number(target.getAttribute("snw-data-line-number"));
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
                    setTimeout(() => {
                        this.thePlugin.app.workspace.getActiveViewOfType(MarkdownView).setEphemeralState({line: LineNu });
                    }, 200);
                });
                // @ts-ignore
                if(this.app.internalPlugins.plugins['page-preview'].enabled===true) {
                    el.addEventListener('mouseover', (e: PointerEvent) => {
                        // @ts-ignore
                        const hoverMetaKeyRequired = app.internalPlugins.plugins['page-preview'].instance.overrides['obsidian42-strange-new-worlds']==false ? false : true;
                        if( hoverMetaKeyRequired===false || (hoverMetaKeyRequired===true && (e.ctrlKey || e.metaKey)) ) {
                            const target = e.target as HTMLElement;
                            const previewLocation = { scroll: Number(target.getAttribute("snw-data-line-number")) };
                            const filePath  = target.getAttribute("snw-data-file-name");
                            // parameter signature for link-hover parent: HoverParent, targetEl: HTMLElement, linkText: string, sourcePath: string, eState: EphemeralState
                            app.workspace.trigger( "link-hover", {}, target, filePath, "", previewLocation);   
                        }
                    });    
                }
            });    
        }, 500);
        
    }

    async onClose() { // Nothing to clean up.
    }
}

/**
 *  For the given file, find the link passed in and returns the line number. 
 *
 * @param {string} filePath
 * @param {string} link
 * @return {*}  {number}
 */
 const findPositionInFile = (filePath:string, link: string): number => {

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