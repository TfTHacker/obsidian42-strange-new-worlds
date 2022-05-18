import {ItemView, MarkdownPreviewRenderer, MarkdownRenderer, WorkspaceLeaf} from "obsidian";
import { getReferencesCache } from "./indexer";
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
        return "SNW view";
    }

    async onOpen() {
        const container: HTMLElement = this.containerEl;
        container.empty();
        const key = this.thePlugin.sidepaneOutput;

        const refCache = getReferencesCache()[key];

        const filePath = this.thePlugin.app.workspace.activeLeaf.view.file.path;
    
        console.log("key: " + key);
        
        let output = "";  
        refCache.forEach(ref => {
            if(filePath!=ref.sourceFile.path)
                output += `- [[${ref.sourceFile.path.replace(".md","")}]]\n`;
        })
        console.log(output)

        setTimeout(() => {
            console.log('hello')
            document.querySelectorAll('[data-type="Strange New Worlds"] a').forEach(el => {
                console.log(el);
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log(e.target.innerText);
                    const fileT = app.metadataCache.getFirstLinkpathDest(e.target.innerText, e.target.innerText);
                    this.thePlugin.app.workspace.activeLeaf.openFile(fileT);
                })
            });
        }, 300);
        try {
            await MarkdownRenderer.renderMarkdown(output, container, "", null )

        } catch (error) {
            
        }

        // container.createEl("div", {text: this.thePlugin.sidepaneOutput});
    }

    async onClose() { // Nothing to clean up.
    }
}
