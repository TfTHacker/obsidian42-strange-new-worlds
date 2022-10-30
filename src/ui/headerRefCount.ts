// Displays in the header of open documents the count of incoming links

import {MarkdownView, Platform, WorkspaceLeaf} from "obsidian";
import {Link} from "../types";
import ThePlugin from "../main";
import {processHtmlDecorationReferenceEvent} from "../view-extensions/htmlDecorations";
import {getSnwAllLinksResolutions} from "../indexer";
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'
import { getUIC_Hoverview } from "./components/uic-ref--parent";

let thePlugin: ThePlugin;

export function setPluginVariableForHeaderRefCount(plugin: ThePlugin) {
    thePlugin = plugin;
}


/**
 * Iterates all open documents to see if they are markdown file, and if so callsed processHeader
 *
 * @export
 */
export default function setHeaderWithReferenceCounts() {
    if(thePlugin.snwAPI.enableDebugging?.LinkCountInHeader) 
        thePlugin.snwAPI.console("headerImageCount.setHeaderWithReferenceCounts(thePlugin)", ThePlugin);
    
    thePlugin.app.workspace.iterateAllLeaves((leaf : WorkspaceLeaf) => {
        if (leaf.view.getViewType() === "markdown") 
            processHeader(leaf.view as MarkdownView);
    })
}

/**
 * Analyzes the page and if there is incoming links displays a header message
 *
 * @param {MarkdownView} mdView
 */
function processHeader(mdView: MarkdownView) {
    if(thePlugin.snwAPI.enableDebugging?.LinkCountInHeader) 
        thePlugin.snwAPI.console("headerImageCount.processHeader(ThePlugin, MarkdownView)", thePlugin, mdView);
    
    const allLinks: Link[] = getSnwAllLinksResolutions(); 
    const incomingLinks = allLinks.filter(f=>f?.resolvedFile.path===mdView.file.path);
    
    // if no incoming links, check if there is a header and remove it. In all cases, exit roturin
    if (incomingLinks.length < thePlugin.settings.minimumRefCountThreshold) {
        if (mdView.contentEl.querySelector(".snw-header-count-wrapper")) 
        mdView.contentEl.querySelector(".snw-header-count-wrapper").remove();
        return;
    }
        
    let snwTitleRefCountDisplayCountEl: HTMLElement = mdView.contentEl.querySelector(".snw-header-count");

    // header count is already displayed, just update information.
    if( snwTitleRefCountDisplayCountEl && snwTitleRefCountDisplayCountEl.getAttribute("data-snw-key") === mdView.file.basename ) {
        snwTitleRefCountDisplayCountEl.innerText =  " " + incomingLinks.length.toString() + " ";
        return
    }

    const containerViewContent: HTMLElement = mdView.contentEl;

    if (mdView.contentEl.querySelector(".snw-header-count-wrapper")) 
        mdView.contentEl.querySelector(".snw-header-count-wrapper").remove();

    let wrapper: HTMLElement = containerViewContent.querySelector(".snw-header-count-wrapper");

    if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.className = "snw-header-count-wrapper";
        snwTitleRefCountDisplayCountEl = document.createElement("div");
        snwTitleRefCountDisplayCountEl.className = "snw-header-count"; 
        wrapper.appendChild(snwTitleRefCountDisplayCountEl);
        containerViewContent.prepend(wrapper)
    } else {
        snwTitleRefCountDisplayCountEl = containerViewContent.querySelector(".snw-header-count");
    }

    snwTitleRefCountDisplayCountEl.innerText = " " + incomingLinks.length.toString() + " ";
    if(Platform.isDesktop || Platform.isDesktopApp) {
            snwTitleRefCountDisplayCountEl.onclick = (e : MouseEvent)=> {
            e.stopPropagation();
            processHtmlDecorationReferenceEvent(wrapper)
        };
    }
    wrapper.setAttribute("data-snw-key", mdView.file.basename);
    wrapper.setAttribute("data-snw-type", "File");
    wrapper.setAttribute("data-snw-filepath", mdView.file.path);
    // if(Platform.isDesktop || Platform.isDesktopApp) {
        wrapper.onclick = (e : MouseEvent) => {
            e.stopPropagation();
            processHtmlDecorationReferenceEvent(e.target as HTMLElement);
        }
    // }

    tippy(wrapper, {
        interactive: true,
        appendTo: () =>  wrapper.closest(".view-content"),
        allowHTML: true,
        onShow(instance) { setTimeout( async () => {
            await getUIC_Hoverview(instance)
        }, 1); } 
    });

    if(thePlugin.snwAPI.enableDebugging?.LinkCountInHeader) 
        thePlugin.snwAPI.console("snwTitleRefCountDisplayCountEl", snwTitleRefCountDisplayCountEl)

}
