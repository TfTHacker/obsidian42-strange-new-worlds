import ThePlugin from "../main";
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { getUIC_Hoverview } from "src/ui/components/uic-hover-view";

let thePlugin: ThePlugin;

export function setPluginVariableForHtmlDecorations(plugin: ThePlugin) {
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
 * @param {string} link             The link for the unique key
 * @param {string} attachCSSClass   if special class is need for the elment
 * @return {*}  {HTMLElement}
 */
export function htmlDecorationForReferencesElement(count: number, referenceType: string, key: string, link: string, attachCSSClass: string): HTMLElement {
    if(thePlugin?.snwAPI.enableDebugging?.HtmlDecorationElements) 
        thePlugin.snwAPI.console("htmlDecorations.htmlDecorationForReferencesElement(count, referenceType, key, link)", thePlugin, count,referenceType,key,link);

    const element = document.createElement("div")
    element.className = "snw-reference snw-" + referenceType;
    element.innerText= " " + count.toString() + " ";
    element.setAttribute("data-snw-key", key);
    element.setAttribute("data-snw-type", referenceType);
    element.setAttribute("data-snw-link", link);
    if(attachCSSClass) element.addClass(attachCSSClass);

    // element.onclick = async (e: MouseEvent ) => processHtmlDecorationReferenceEvent(e.target as HTMLElement);

    if(thePlugin?.snwAPI.enableDebugging?.HtmlDecorationElements) 
        thePlugin.snwAPI.console("returned element", element);

    tippy(element, {
        interactive: true,
        appendTo: () => document.body,
        allowHTML: true,
        onShow(instance) { setTimeout( async () => {
            await getUIC_Hoverview(instance)
        }, 1); } 
    });

    return element;
}

export const processHtmlDecorationReferenceEvent = async (target: HTMLElement) => {
    const key = target.getAttribute("data-snw-key");
    const refType = target.getAttribute("data-snw-type");
    const link = target.getAttribute("data-snw-link")

    if(thePlugin.snwAPI.enableDebugging?.HtmlDecorationElements) 
        thePlugin.snwAPI.console("htmlDecorations.processHtmlDecorationReferenceEvent: target, key, refType, link", target,key,refType,link );

    thePlugin.activateView(key, refType, link);

}
