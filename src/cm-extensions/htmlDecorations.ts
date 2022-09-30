import ThePlugin from "../main";
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { getUIC_Hoverview } from "src/ui/components/uic-ref--parent";

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
 * @param {string} filePath         File path in file in vault
 * @param {string} attachCSSClass   if special class is need for the elment
 * @return {*}  {HTMLElement}
 */
export function htmlDecorationForReferencesElement(count: number, referenceType: string, key: string, filePath: string, attachCSSClass: string, lineNu: number): HTMLElement {
    if(thePlugin?.snwAPI.enableDebugging?.HtmlDecorationElements) 
        thePlugin.snwAPI.console("htmlDecorations.htmlDecorationForReferencesElement(count, referenceType, key, filePath)", thePlugin, count,referenceType,key,filePath);

    const element = document.createElement("div")
    element.className = "snw-reference snw-" + referenceType;
    element.innerText= " " + count.toString() + " ";
    element.setAttribute("data-snw-type", referenceType);
    element.setAttribute("data-snw-key", key);
    element.setAttribute("data-snw-filepath", filePath);
    element.setAttribute("snw-data-line-number", lineNu)
    if(attachCSSClass) element.addClass(attachCSSClass);

    element.onclick = async (e: MouseEvent ) => processHtmlDecorationReferenceEvent(e.target as HTMLElement);

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
    const refType = target.getAttribute("data-snw-type");
    const key = target.getAttribute("data-snw-key");
    const filePath = target.getAttribute("data-snw-filepath")
    const lineNu = target.getAttribute("snw-data-line-number")
    

    if(thePlugin.snwAPI.enableDebugging?.HtmlDecorationElements) 
        thePlugin.snwAPI.console("htmlDecorations.processHtmlDecorationReferenceEvent: target, key, refType, filePath", target,key,refType, filePath);

    thePlugin.activateView(refType, key, filePath, lineNu);

}
