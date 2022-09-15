// Displays in the header of open documents the count of incoming links

import {MarkdownView, WorkspaceLeaf} from "obsidian";
import {Link} from "./types";
import ThePlugin from "./main";
import {processHtmlDecorationReferenceEvent} from "./htmlDecorations";


/**
 * Iterates all open documents to see if they are markdown file, and if so callsed processHeader
 *
 * @export
 * @param {ThePlugin} thePlugin
 */
export default function setHeaderWithReferenceCounts(thePlugin: ThePlugin) {
    if(thePlugin.settings.displayIncomingFilesheader===false) return;
    if(thePlugin.snwAPI.enableDebugging?.LinkCountInHeader) 
        thePlugin.snwAPI.console("headerImageCount.setHeaderWithReferenceCounts(thePlugin)", ThePlugin);
    
    thePlugin.app.workspace.iterateAllLeaves((leaf : WorkspaceLeaf) => {
        if (leaf.view.getViewType() === "markdown") 
            processHeader(thePlugin, leaf.view as MarkdownView);
    })
}


/**
 * Analyzes the page and if there is incoming links displays a header message
 *
 * @param {ThePlugin} thePlugin
 * @param {MarkdownView} mdView
 */
function processHeader(thePlugin: ThePlugin, mdView: MarkdownView) {
    if(thePlugin.snwAPI.enableDebugging?.LinkCountInHeader) 
        thePlugin.snwAPI.console("headerImageCount.processHeader(ThePlugin, MarkdownView)", thePlugin, mdView);
    
    const allLinks: Link[] = thePlugin.app.fileManager.getAllLinkResolutions();
    const incomingLinks = allLinks.filter(f=>f?.resolvedFile.path===mdView.file.path);

    const containerTitleDiv: HTMLDivElement = mdView.containerEl.querySelector(".view-content");
    const fileList = (incomingLinks.map(link => link.sourceFile.path.replace(".md", ""))).slice(0,20).join("\n")

    if (incomingLinks.length === 0) {
        if (mdView.containerEl.querySelector(".snw-header-count-wrapper")) 
            mdView.containerEl.querySelector(".snw-header-count-wrapper").remove();
        return
    }

    if (containerTitleDiv) {
        let snwTitleRefCountDisplayCountEl: HTMLElement;
        let wrapper: HTMLElement = mdView.containerEl.querySelector(".snw-header-count-wrapper");

        if (!wrapper) {
            wrapper = document.createElement("div");
            wrapper.className = "snw-header-count-wrapper";
            snwTitleRefCountDisplayCountEl = document.createElement("div");
            snwTitleRefCountDisplayCountEl.className = "snw-header-count"; 
            wrapper.appendChild(snwTitleRefCountDisplayCountEl);
            containerTitleDiv.prepend(wrapper)
        } else 
            snwTitleRefCountDisplayCountEl = mdView.containerEl.querySelector(".snw-header-count");

        snwTitleRefCountDisplayCountEl.innerText = " " + incomingLinks.length.toString() + " ";
        snwTitleRefCountDisplayCountEl.setAttribute("data-snw-key", mdView.file.basename);
        snwTitleRefCountDisplayCountEl.setAttribute("data-snw-type", "File");
        snwTitleRefCountDisplayCountEl.setAttribute("data-snw-link", mdView.file.path);
        snwTitleRefCountDisplayCountEl.ariaLabel = "Strange New Worlds\n" + fileList + "\n----\n-->Click for more details";
        snwTitleRefCountDisplayCountEl.onclick = (e : MouseEvent) => processHtmlDecorationReferenceEvent(e, thePlugin);

        if(thePlugin.snwAPI.enableDebugging?.LinkCountInHeader) 
            thePlugin.snwAPI.console("snwTitleRefCountDisplayCountEl", snwTitleRefCountDisplayCountEl)
    }

}
