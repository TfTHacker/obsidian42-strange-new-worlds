import {ItemView, MarkdownPreviewRenderer, MarkdownRenderer, WorkspaceLeaf} from "obsidian";
import { getReferencesCache } from "./indexer";
import { Link } from "./types";
import ThePlugin from "./main";

export const VIEW_TYPE_SNW = "Strange New Worlds";

export class SidePaneView extends ItemView {
    contentEl: HTMLElement;
    thePlugin: ThePlugin;
    
    constructor(leaf : WorkspaceLeaf, thePlugin: ThePlugin) {
        super(leaf);
        this.thePlugin = thePlugin;
    }

    getViewType() {
        return VIEW_TYPE_SNW;
    }

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

        let refCache = refType === "link" ?  getReferencesCache()[key] :  getReferencesCache()[link];

        console.log("key", key)
        console.log("link", link)
        console.log("refCache", refCache)

        let output = `<div class="snw-sidepane-container">`;

        output += `<h1 class="snw-sidepane-header">${refType}</h1>`;
        const sourceLink = refCache[0].reference.link;
        output += `Source: <a class="internal-link snw-sidepane-link" data-href="${sourceLink}" href="${sourceLink}">${sourceLink.replace(".md","")}</a> `;

        output += `<h2 class="snw-sidepane-header-references">References</h2>`;

        output += `<ul>`;
        refCache.forEach(ref => {
            if(filePath!=ref.sourceFile.path){
                output += `<li><a class="internal-link snw-sidepane-link" data-href="${ref.sourceFile.path}" href="${ref.sourceFile.path}">${ref.sourceFile.basename}</a></li>`;
            }
        })
        output += `</ul>`;
        output += `</div>`; //end of container

        container.innerHTML = output;

        setTimeout(() => {
            document.querySelectorAll('.snw-sidepane-link').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    const filePath  = (e.target as HTMLElement).getAttribute("data-href");
                    const fileT = app.metadataCache.getFirstLinkpathDest(filePath, filePath);
                    this.thePlugin.app.workspace.activeLeaf.openFile(fileT);
                })
            });    
        }, 200);
        
    }

    async onClose() { // Nothing to clean up.
    }
}
