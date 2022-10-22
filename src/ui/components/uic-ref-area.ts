//wrapper element for references area. shared between popover and sidepane

import { getReferencesCache, getSnwAllLinksResolutions } from "src/indexer";
import { Link } from "src/types";
import { getUIC_Ref_Item } from "./uic-ref-item";
import { getUIC_Ref_Title_Div } from "./uic-ref-title";


export /**
 *  Crates the primarhy "AREA" body for displaying refrences. This is the overall wrapper for the title and individaul references
 *
 * @param {string} refType
 * @param {string} key
 * @param {string} filePath
 * @param {boolean} isHoverView
 * @return {*}  {Promise<string>}
 */
const getUIC_Ref_Area = async (refType: string, key: string, filePath: string, lineNu: number, isHoverView:boolean): Promise<HTMLElement> => {
    const refAreaItems = await getRefAreaItems(refType, key, filePath);
    const refAreaContainerEl = createDiv();
    
    //get title header for this reference area
    refAreaContainerEl.append(await getUIC_Ref_Title_Div(key, filePath, refAreaItems.refCount, lineNu, isHoverView)); 

    const refAreaEl = createDiv();
    refAreaEl.addClass("snw-ref-area");
    refAreaEl.append(refAreaItems.response)
    refAreaContainerEl.append(refAreaEl)

    return refAreaContainerEl;
}


/**
 * Creates a DIV for a colection of reference blocks to be displayed
 *
 * @param {string} refType
 * @param {string} key
 * @param {string} filePath
 * @return {*}  {Promise<{response: string, refCount: number}>}
 */
const getRefAreaItems = async (refType: string, key: string, filePath: string): Promise<{response: HTMLElement, refCount: number}> => {
    
    // let responseContent = ``;
    // const responseWrapperContainerEl = createDiv();

    let countOfRefs = 0;
    let linksToLoop: Link[] = null;

    if(refType==="File") {
        const allLinks: Link[] = getSnwAllLinksResolutions(); 
        const incomingLinks = allLinks.filter(f=>f?.resolvedFile.path===filePath);
        countOfRefs = incomingLinks.length;
        linksToLoop = incomingLinks;
    } else {
        let refCache: Link[] = getReferencesCache()[key];
        if(refCache === undefined) refCache = getReferencesCache()[filePath + "#^" + key];    
        const sortedCache = await sortRefCache(refCache);    
        countOfRefs = sortedCache.length;
        linksToLoop = sortedCache;
    }

    // get the unique file names for files in thie refeernces
    const uniqueFileKeys: Link[] = Array.from(new Set(linksToLoop.map(a => a.sourceFile.path)))
            .map(file_path => { return linksToLoop.find(a => a.sourceFile.path === file_path)}
        );


    const wrapperEl = createDiv();

    for (const file_path of uniqueFileKeys ) {
        const responseItemContainerEl = createDiv();
        responseItemContainerEl.addClass("snw-ref-item-container");
        wrapperEl.appendChild(responseItemContainerEl);

        const refItemFileEl = createDiv();
        refItemFileEl.addClass("snw-ref-item-file");
        refItemFileEl.setAttribute("snw-data-line-number",  "-1");
        refItemFileEl.setAttribute("snw-data-file-name",    file_path.sourceFile.path.replace(".md",""));
        refItemFileEl.setAttribute("data-href",             file_path.sourceFile.path);
        refItemFileEl.setAttribute("href",                  file_path.sourceFile.path);
        refItemFileEl.innerText = file_path.sourceFile.basename;
        responseItemContainerEl.appendChild(refItemFileEl);

        for (const ref of linksToLoop) {
            if(file_path.sourceFile.path===ref.sourceFile.path) {
                responseItemContainerEl.appendChild(await getUIC_Ref_Item(ref));
            }
        }
    }

    return {response: wrapperEl, refCount: countOfRefs};
}


const sortRefCache = async (refCache: Link[]): Promise<Link[]> => {
    return refCache.sort((a,b)=>{
        return a.sourceFile.basename.localeCompare(b.sourceFile.basename) ||
               Number(a.reference.position.start.line) - Number(b.reference.position.start.line);
    });
}
