import ThePlugin from "./main";

export const processHtmlDecorationReferenceEvent = async (event: MouseEvent, plugin: ThePlugin) => {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const key = target.getAttribute("data-snw-key");
    const refType = target.getAttribute("data-snw-type");
    const link = target.getAttribute("data-snw-link")

    plugin.activateView(key, refType, link);

    // app.workspace.trigger("hover-link", {
    //     event: event,
    //     source: 'source',
    //     hoverParent: document.querySelector(".markdown-preview-view"),
    //     targetEl: null,
    //     linktext: 'test',
    // });

}

export function htmlDecorationForReferencesElement(thePlugin: ThePlugin, count: number, referenceType: string, key: string, link: string, ariaLabel: string): HTMLElement {
    const element = document.createElement("span")
    element.className = "snw-reference snw-" + referenceType;
    element.innerText= " " + count.toString() + " ";
    element.setAttribute("data-snw-key", key);
    element.setAttribute("data-snw-type", referenceType);
    element.setAttribute("data-snw-link", link);
    element.ariaLabel = ariaLabel;

    element.onclick = (e: MouseEvent ) => processHtmlDecorationReferenceEvent(e, thePlugin);        
    
    // element.onmouseover = async (e: any ) => processReferenceEvent(e, thePlugin); 

    return element;
}




    