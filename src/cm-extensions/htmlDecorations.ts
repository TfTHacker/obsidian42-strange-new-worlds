import ThePlugin from "../main";
import tippy, { Instance, ReferenceElement } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { getReferencesCache } from "src/indexer";
import { Link } from "src/types";
import { MarkdownRenderer, Pos, TFile } from "obsidian";


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
 * @param {string} ariaLabel        the help tip shown when mouse hovers over the box
 * @param {string} attachCSSClass   if special class is need for the elment
 * @return {*}  {HTMLElement}
 */
export function htmlDecorationForReferencesElement(count: number, referenceType: string, key: string, link: string, ariaLabel: string, attachCSSClass: string): HTMLElement {
    if(thePlugin?.snwAPI.enableDebugging?.HtmlDecorationElements) 
        thePlugin.snwAPI.console("htmlDecorations.htmlDecorationForReferencesElement(count, referenceType, key, link, arialLabel)", thePlugin, count,referenceType,key,link,ariaLabel);

    const element = document.createElement("div")
    element.className = "snw-reference snw-" + referenceType;
    element.innerText= " " + count.toString() + " ";
    element.setAttribute("data-snw-key", key);
    element.setAttribute("data-snw-type", referenceType);
    element.setAttribute("data-snw-link", link);
    // if(ariaLabel!="")
    //     element.ariaLabel = ariaLabel;
    if(attachCSSClass) element.addClass(attachCSSClass);

    element.onclick = async (e: MouseEvent ) => processHtmlDecorationReferenceEvent(e.target as HTMLElement);

    if(thePlugin?.snwAPI.enableDebugging?.HtmlDecorationElements) 
        thePlugin.snwAPI.console("returned element", element);

    tippy(element, {
        interactive: true,
        appendTo: () => document.body,
        allowHTML: true,
        onShow(instance) { setTimeout( async () => {
            await createPopup(instance)
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

const createPopup = async (instance: Instance)=> {
    const parentElement: ReferenceElement = instance.reference;
    const key = parentElement.getAttribute("data-snw-key");
    const refType = parentElement.getAttribute("data-snw-type");
    const link = parentElement.getAttribute("data-snw-link")

    let contentForRefType = "";

    switch (refType) {
        case "link":
            contentForRefType = await htmlForReferences(key, link);
            break;
        case "embed":
            contentForRefType = await htmlForReferences(key, link);
            break;
        case "block":
            contentForRefType = await htmlForReferences(key, link);
            break;
        case "heading":
            contentForRefType = await htmlForReferences(key, link);
            break;
        case "File":
            break;
    } 

    let output = `<div class="snw-popup-container">`; // START
    output += `<div class="snw-popup-header">Reference: ${link}</div>`;
    output += contentForRefType;
    output += `</div>`; // END

    instance.setContent(output)
}

const sortRefCache = async (refCache: Link[]): Promise<Link[]> => {
    return refCache.sort((a,b)=>{
        return a.sourceFile.basename.localeCompare(b.sourceFile.basename) ||
               Number(a.reference.position.start.line) - Number(b.reference.position.start.line);
    });
}


const htmlForReferences = async (key: string, link: string): Promise<string> => {
    let refCache: Link[] = getReferencesCache()[link];
    if(refCache === undefined) refCache = getReferencesCache()[thePlugin.app.workspace.activeLeaf.view.file.basename + "#^" + key];            

    const sortedCache = (await sortRefCache(refCache)).slice(0, thePlugin.settings.displayNumberOfFilesInTooltip);    

    let response = `<div>`;

    for (const ref of await sortedCache) {
        response += `<div class="snw-popup-file">
                     <a class="snw-popup-anchor"   
                      snw-data-line-number="${ref.reference.position.start.line}" 
                      snw-data-file-name="${ref.sourceFile.path}"
                      data-href="${ref.sourceFile.path}" 
                      href="${ref.sourceFile.path}">${ref.sourceFile.basename}</a>
                      </div>`;
        response += `<div class="snw-popup-markdown-rendering">`
        response += await grabChunkOfFile(ref.sourceFile, ref.reference.position);        
        response += `</div>`;
    }

    response += `</div>`;

    return response;
}


const grabChunkOfFile = async (file: TFile, position: Pos): Promise<string> =>{
    const fileContents = await thePlugin.app.vault.cachedRead(file)
    const cachedMetaData = thePlugin.app.metadataCache.getFileCache(file);

    let startPosition = 0;
    let endPosition = 0;

    for (let i = 0; i < cachedMetaData.sections.length; i++) {
        const sec = cachedMetaData.sections[i];
        if(sec.position.start.offset<=position.start.offset && sec.position.end.offset>=position.end.offset) {
            startPosition = sec.position.start.offset;
            endPosition = sec.position.end.offset;
            break;
        }
    }

    const blockContents = fileContents.substring(startPosition, endPosition);

    const el = document.createElement("div");
    await MarkdownRenderer.renderMarkdown(blockContents, el, file.path, thePlugin)


    return el.innerHTML
}
