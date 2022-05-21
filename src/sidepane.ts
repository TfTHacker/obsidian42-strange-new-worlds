import {CachedMetadata, ItemView, MetadataCache, WorkspaceLeaf} from "obsidian";
import {getCurrentPage, getReferencesCache} from "./indexer";
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
        console.log("Sideview onOpen")
        const container: HTMLElement = this.containerEl;
        container.empty();
        const key = this.thePlugin.lastSelectedReferenceKey;
        const refType = this.thePlugin.lastSelectedReferenceType;
        const link = this.thePlugin.lastSelectedReferenceLink;
        const filePath = this.thePlugin.app.workspace.activeLeaf.view.file.path;
        let lineNumber = 0;

        // console.log("Sideview key,reftype, link, filePath, basename", key, refType, link, filePath, this.thePlugin.app.workspace.activeLeaf.view.file.basename );
        
        let refCache: Link[] = [];
        
        if(refType === "link" || refType === "embed") {
           refCache = getReferencesCache()[key];
        }
        else if(refType === "File") {
            Object.entries(getReferencesCache()).forEach((value, key) => {
                value[1].forEach((element:Link[]) => {
                    if(element.resolvedFile.path === link) {
                        refCache.push(element)
                    }
                });
            })
        } else if(refType==="block") {
            refCache =  getReferencesCache()[link];
            if(refCache === undefined)
                refCache = getReferencesCache()[this.thePlugin.app.workspace.activeLeaf.view.file.basename + "#^" + key];            
        } else {
            refCache =  getReferencesCache()[link];
        }

            
        //     console.log(getReferencesCache())
        // console.log("Sideview refcache", refCache);
        
        let output = '<div class="snw-sidepane-container">';
        output = output + '<h1 class="snw-sidepane-header">' + refType + '</h1>';
        const sourceLink = refType === "File" ? link : refCache[0].reference.link;
        output += `Source: <a class="internal-link snw-sidepane-link" data-href="${sourceLink}" href="${sourceLink}">${sourceLink.replace(".md","")}</a> `;
        output += `<h2 class="snw-sidepane-header-references">References</h2>`;
        output += `<ul>`;
        const findPositionInFile = (filePath:string, link: string) => {
            console.log(filePath, link)
            // let lineNu = 0;
            const cachedData: CachedMetadata = app.metadataCache.getCache(filePath);
            console.log("cachedData", cachedData);
            if(cachedData?.links) {
                for (const i of cachedData?.links) {
                    if(i.link===link) {
                        return i.position.start.line;
                    }
                }
            }
            return 0;
        }

        refCache.forEach(ref => {
            if(filePath!=ref.sourceFile.path){ 
                lineNumber = findPositionInFile(ref.sourceFile.path, ref.reference.link);
                output += `<li><a class="internal-link snw-sidepane-link" data-line-number="${lineNumber}" data-href="${ref.sourceFile.path}" href="${ref.sourceFile.path}">${ref.sourceFile.basename}</a></li>`;
            }
        })
        
        output += `</ul>`;
        output += `</div>`; //end of container

        container.innerHTML = output;

        setTimeout(() => {
            document.querySelectorAll('.snw-sidepane-link').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = e.target as HTMLElement;
                    const filePath  = target.getAttribute("data-href");
                    const LineNu = Number(target.getAttribute("data-line-number"));
                    const fileT = app.metadataCache.getFirstLinkpathDest(filePath, filePath);
                    this.thePlugin.app.workspace.activeLeaf.openFile(fileT);
                    if(LineNu!=0) {
                        setTimeout(() => {
                            console.log("lineNumber", LineNu)
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
