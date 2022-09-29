//wrapper element for references area. shared between popover and sidepane

import { getReferencesCache, getSnwAllLinksResolutions } from "src/indexer";
import ThePlugin from "src/main";
import { Link } from "src/types";
import { getUIC_Ref_Item } from "./uic-ref-item";
import { getUIC_ref_title_DivEnd, getUIC_Ref_Title_DivStart } from "./uic-ref-title";


let thePlugin: ThePlugin;

export function setPluginVariableUIC_RefArea(plugin: ThePlugin) {
    thePlugin = plugin;
}

export /**
 *  Crates the primarhy "AREA" body for displaying refrences. This is the overall wrapper for the title and individaul references
 *
 * @param {string} refType
 * @param {string} key
 * @param {string} filePath
 * @param {boolean} isHoverView
 * @return {*}  {Promise<string>}
 */
const getUIC_Ref_Area = async (refType: string, key: string, filePath: string, isHoverView:boolean): Promise<string> => {
    
    const refAreaItems = await getRefAreaItems(refType, key, filePath);

    let response = "";
    response += await getUIC_Ref_Title_DivStart(key, filePath, refAreaItems.refCount, isHoverView); //get title header for this reference ara
    response += await getUIC_ref_title_DivEnd();                  //get the ending html 
    response += `<div class="snw-ref-area">`;
    response += refAreaItems.response;
    response += `</div>`;
    return response;
}


/**
 * Creates a DIV for a colection of reference blocks to be displayed
 *
 * @param {string} refType
 * @param {string} key
 * @param {string} filePath
 * @return {*}  {Promise<{response: string, refCount: number}>}
 */
const getRefAreaItems = async (refType: string, key: string, filePath: string): Promise<{response: string, refCount: number}> => {
    
    let responseContent = ``;
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
        const sortedCache = (await sortRefCache(refCache)).slice(0, thePlugin.settings.displayNumberOfFilesInTooltip);    
        countOfRefs = sortedCache.length;
        linksToLoop = sortedCache;
    }

    // get the unique file names for files in thie refeernces
    const uniqueFileKeys: Link[] = Array.from(new Set(linksToLoop.map(a => a.sourceFile.path)))
            .map(file_path => { return linksToLoop.find(a => a.sourceFile.path === file_path)}
        );

    for (const file_path of uniqueFileKeys ) {
            responseContent += `<div class="snw-ref-item-container">
                                     <div class="snw-ref-item-file"
                                        snw-data-line-number="${-1}" 
                                        snw-data-file-name="${file_path.sourceFile.path}"
                                        data-href="${file_path.sourceFile.path}" 
                                        href="${file_path.sourceFile.path}">${file_path.sourceFile.basename}</div>`;
            for (const ref of linksToLoop) {
                if(file_path.sourceFile.path===ref.sourceFile.path) {
                    responseContent += await getUIC_Ref_Item(ref);
                }
            }
            responseContent += `</div>`;
    }



    return {response: responseContent, refCount: countOfRefs};
}


const sortRefCache = async (refCache: Link[]): Promise<Link[]> => {
    return refCache.sort((a,b)=>{
        return a.sourceFile.basename.localeCompare(b.sourceFile.basename) ||
               Number(a.reference.position.start.line) - Number(b.reference.position.start.line);
    });
}
