// Displays in the header of open documents the count of incoming links

import {MarkdownView, Platform, WorkspaceLeaf} from "obsidian";
import {Link} from "../types";
import SNWPlugin from "../main";
import {processHtmlDecorationReferenceEvent} from "../view-extensions/htmlDecorations";
import {getSnwAllLinksResolutions, getSNWCacheByFile} from "../indexer";
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'
import { getUIC_Hoverview } from "./components/uic-ref--parent";

let thePlugin: SNWPlugin;

export function setPluginVariableForHeaderRefCount(plugin: SNWPlugin) {
    thePlugin = plugin;
}


/**
 * Iterates all open documents to see if they are markdown file, and if so callsed processHeader
 *
 * @export
 */
export default function setHeaderWithReferenceCounts() {
    if(thePlugin.snwAPI.enableDebugging?.LinkCountInHeader) 
        thePlugin.snwAPI.console("headerImageCount.setHeaderWithReferenceCounts(thePlugin)", SNWPlugin);
    
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
    if(allLinks==undefined) return;

    const incomingLinks = allLinks.filter(f=>{
        if(!f?.resolvedFile) return false;
        return f?.resolvedFile?.path===mdView.file.path;
    });

    let incomingLinksCount = incomingLinks.length;

    // check if the page is to be ignored
    const transformedCache = getSNWCacheByFile(mdView.file);
    if(transformedCache?.cacheMetaData?.frontmatter?.["snw-file-exclude"]===true) incomingLinksCount=0;

    // check if headers for this file are excluded
    if(incomingLinks[0]?.excludedFile===true) incomingLinksCount=0;

    // if no incoming links, check if there is a header and remove it. In all cases, exit roturin
    if (incomingLinksCount < thePlugin.settings.minimumRefCountThreshold) {
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
        wrapper = createDiv({cls: "snw-header-count-wrapper"});
        snwTitleRefCountDisplayCountEl = createDiv({cls: "snw-header-count"}); 
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
    wrapper.setAttribute("data-snw-reallink", mdView.file.basename);
    wrapper.setAttribute("data-snw-key", mdView.file.basename);
    wrapper.setAttribute("data-snw-type", "File");
    wrapper.setAttribute("data-snw-filepath", mdView.file.path);
    // if(Platform.isDesktop || Platform.isDesktopApp) {
        wrapper.onclick = (e : MouseEvent) => {
            e.stopPropagation();
            processHtmlDecorationReferenceEvent(e.target as HTMLElement);
        }
    // }

    const tippyObject =  tippy(wrapper, {
        interactive: true,
        appendTo: () =>  document.body, 
        allowHTML: true,
        zIndex: 9999,
        placement: "auto-end",
        onShow(instance) { setTimeout( async () => {
            await getUIC_Hoverview(instance)
        }, 1); } 
    });

    tippyObject.popper.classList.add("snw-tippy");
    
    if(thePlugin.snwAPI.enableDebugging?.LinkCountInHeader) 
        thePlugin.snwAPI.console("snwTitleRefCountDisplayCountEl", snwTitleRefCountDisplayCountEl)

}
