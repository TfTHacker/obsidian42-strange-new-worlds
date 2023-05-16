import SNWPlugin from "../main";
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { getUIC_Hoverview } from "src/ui/components/uic-ref--parent";
import { Platform } from "obsidian";

let thePlugin: SNWPlugin;

export function setPluginVariableForHtmlDecorations(plugin: SNWPlugin) {
    thePlugin = plugin;
}

/**
 * Shared function between refrences-cm6.ts and references-preview.s
 * This decoration is just the html box drawn into the document with the count of references.
 * It is used in the header as well as inline in the document. If a user clicks on this element,
 * the function processHtmlDecorationReferenceEvent is called
 *
 * @export
 * @param {number} count            Number to show in the box
 * @param {string} referenceType    The type of references (block, embed, link, header)
 * @param {string} key              Unique key used to identify this reference based on its type
 * @param {string} filePath         File path in file in vault
 * @param {string} attachCSSClass   if special class is need for the elment
 * @return {*}  {HTMLElement}
 */
export function htmlDecorationForReferencesElement(count: number, referenceType: string, realLink: string, key: string, filePath: string, attachCSSClass: string, lineNu: number): HTMLElement {
    if(thePlugin?.snwAPI.enableDebugging?.HtmlDecorationElements) 
        thePlugin.snwAPI.console("htmlDecorations.htmlDecorationForReferencesElement(count, referenceType, realLink, key, filePath)", thePlugin, count,referenceType,realLink,key,filePath);

    const element = createDiv({cls: "snw-reference snw-" + referenceType });
    element.innerText= count.toString();
    element.setAttribute("data-snw-type", referenceType);
    element.setAttribute("data-snw-reallink", realLink);
    element.setAttribute("data-snw-key", key);
    element.setAttribute("data-snw-filepath", filePath);
    element.setAttribute("snw-data-line-number", lineNu.toString());
    if(attachCSSClass) element.addClass(attachCSSClass);

    if(Platform.isDesktop || Platform.isDesktopApp) //click is default to desktop, otherwise mobile behaves differently
        element.onclick = async (e: MouseEvent ) => processHtmlDecorationReferenceEvent(e.target as HTMLElement);

    if(thePlugin?.snwAPI.enableDebugging?.HtmlDecorationElements) 
        thePlugin.snwAPI.console("returned element", element);

    const tippyObject =  tippy(element, {
        interactive: true,
        appendTo: () => document.body,
        allowHTML: true,
        zIndex: 9999,
        placement: "auto-end",
        onShow(instance) { setTimeout( async () => {
            await getUIC_Hoverview(instance)
        }, 1); } 
    });
    
    tippyObject.popper.classList.add("snw-tippy");

    return element;
}

export /**
 *  Opens the sidebar SNW pane by calling activateView on main.ts
 *
 * @param {HTMLElement} target
 */
const processHtmlDecorationReferenceEvent = async (target: HTMLElement) => {
    const refType = target.getAttribute("data-snw-type");
    const realLink = target.getAttribute("data-snw-realLink");
    const key = target.getAttribute("data-snw-key");
    const filePath = target.getAttribute("data-snw-filepath");
    const lineNu = target.getAttribute("snw-data-line-number");

    if(thePlugin.snwAPI.enableDebugging?.HtmlDecorationElements) 
        thePlugin.snwAPI.console("htmlDecorations.processHtmlDecorationReferenceEvent: target, realLink, key, refType, filePath", target,realLink, key,refType, filePath);

    thePlugin.activateView(refType, realLink, key, filePath, Number(lineNu));

}
