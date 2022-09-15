import ThePlugin from "./main";



/**
 * Shared function between refrences-cm6.ts and references-preview.s
 * This decoration is just the html box drawn into the document with the count of references.
 * It is used in the header as well as inline in the document. If a user clicks on this element,
 * the function processHtmlDecorationReferenceEvent is called
 *
 * @export
 * @param {ThePlugin} thePlugin
 * @param {number} count            Number to show in the box
 * @param {string} referenceType    The type of references (block, embed, link, header)
 * @param {string} key              Unique key used to identify this reference based on its type
 * @param {string} link             The link for the unique key
 * @param {string} ariaLabel        the help tip shown when mouse hovers over the box
 * @param {string} attachCSSClass   if special class is need for the elment
 * @return {*}  {HTMLElement}
 */
export function htmlDecorationForReferencesElement(thePlugin: ThePlugin, count: number, referenceType: string, key: string, link: string, ariaLabel: string, attachCSSClass: string): HTMLElement {
    if(thePlugin.snwAPI.enableDebugging?.HtmlDecorationElements) 
        thePlugin.snwAPI.console("htmlDecorations.htmlDecorationForReferencesElement(ThePlugin, count, referenceType, key, link, arialLabel)", thePlugin, count,referenceType,key,link,ariaLabel);

    const element = document.createElement("span")
    element.className = "snw-reference snw-" + referenceType;
    element.innerText= " " + count.toString() + " ";
    element.setAttribute("data-snw-key", key);
    element.setAttribute("data-snw-type", referenceType);
    element.setAttribute("data-snw-link", link);
    element.ariaLabel = ariaLabel;
    if(attachCSSClass) element.addClass(attachCSSClass);

    element.onclick = (e: MouseEvent ) => processHtmlDecorationReferenceEvent(e, thePlugin);            
    // element.onmouseover = async (e: any ) => processReferenceEvent(e, thePlugin); 

    if(thePlugin.snwAPI.enableDebugging?.HtmlDecorationElements) 
        thePlugin.snwAPI.console("returned element", element);

    return element;
}


export const processHtmlDecorationReferenceEvent = async (event: MouseEvent, thePlugin: ThePlugin) => {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const key = target.getAttribute("data-snw-key");
    const refType = target.getAttribute("data-snw-type");
    const link = target.getAttribute("data-snw-link")

    if(thePlugin.snwAPI.enableDebugging?.HtmlDecorationElements) 
        thePlugin.snwAPI.console("htmlDecorations.processHtmlDecorationReferenceEvent: target, key, refType, link", target,key,refType,link );

    thePlugin.activateView(key, refType, link);

}




    