import {MarkdownView, Notice, WorkspaceLeaf} from "obsidian";
import {Link} from "./types";
import ThePlugin from "./main";
import {processHtmlDecorationReferenceEvent} from "./htmlDecorations";

export default function setHeaderWithReferenceCounts(thePlugin: ThePlugin) {
    thePlugin.app.workspace.iterateAllLeaves((leaf : WorkspaceLeaf) => {
        if (leaf.view.getViewType() === "markdown") 
            processHeader(thePlugin, leaf.view as MarkdownView);
    })
}

function processHeader(thePlugin: ThePlugin, mdView: MarkdownView) {
    const allLinks: Link[] = thePlugin.app.fileManager.getAllLinkResolutions();
    const incomingLinks = allLinks.filter(f=>f.resolvedFile.path===mdView.file.path);
 
    const headerTitleDiv: HTMLDivElement = mdView.containerEl.querySelector(".view-actions");
    const fileList = (incomingLinks.map(link => link.sourceFile.path.replace(".md", ""))).join("\n")

    if (incomingLinks.length === 0) {
        if (mdView.containerEl.querySelector(".snw-header-count")) 
            mdView.containerEl.querySelector(".snw-header-count").remove();
        return
    }

    if (headerTitleDiv) {
        let snwTitleRefCountDisplayCountEl: HTMLElement = mdView.containerEl.querySelector(".snw-header-count");
        if (! snwTitleRefCountDisplayCountEl) {
            const wrapper: HTMLElement = document.createElement("a");
            wrapper.className = "view-action";
            wrapper.className = "snw-header-count-wrapper";
            snwTitleRefCountDisplayCountEl = document.createElement("div");
            snwTitleRefCountDisplayCountEl.className = "snw-header-count";
            wrapper.appendChild(snwTitleRefCountDisplayCountEl);
            headerTitleDiv.prepend(snwTitleRefCountDisplayCountEl)
        }
        snwTitleRefCountDisplayCountEl.innerText = " " + incomingLinks.length.toString() + " ";
        snwTitleRefCountDisplayCountEl.setAttribute("data-snw-key", mdView.file.basename);
        snwTitleRefCountDisplayCountEl.setAttribute("data-snw-type", "File");
        snwTitleRefCountDisplayCountEl.setAttribute("data-snw-link", mdView.file.path);
        snwTitleRefCountDisplayCountEl.ariaLabel = "Strange New Worlds\n" + fileList + "\n----\n-->Click for more details";
        snwTitleRefCountDisplayCountEl.onclick = (e : any) => processHtmlDecorationReferenceEvent(e, thePlugin);
    }
}
