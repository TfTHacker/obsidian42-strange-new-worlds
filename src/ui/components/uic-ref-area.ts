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

export const getUIC_Ref_Area = async (refType: string, key: string, link: string, isPopover:boolean): Promise<string> => {
    const refAreaItems = await getRefAreaItems(refType, key, link);
    let response = "";
    response += await getUIC_Ref_Title_DivStart(link, refAreaItems.refCount, isPopover); //get title header for this reference ara
    response += await getUIC_ref_title_DivEnd();                  //get the ending html 
    response += `<div class="snw-ref-area">`;
    response += refAreaItems.response;
    response += `</div>`;
    return response;
}


const getRefAreaItems = async (refType: string, key: string, link: string): Promise<{response: string, refCount: number}> => {
    
    let responseContent = ``;
    let countOfRefs = 0;

    if(refType==="File") {
        const allLinks: Link[] = getSnwAllLinksResolutions(); 
        const incomingLinks = allLinks.filter(f=>f?.resolvedFile.path===link);
        countOfRefs = incomingLinks.length;
        for (const ref of incomingLinks) {
            responseContent += await getUIC_Ref_Item(ref);
        }
    } else {
        let refCache: Link[] = getReferencesCache()[link];
        if(refCache === undefined) refCache = getReferencesCache()[link + "#^" + key];    
        const sortedCache = (await sortRefCache(refCache)).slice(0, thePlugin.settings.displayNumberOfFilesInTooltip);    
        countOfRefs = sortedCache.length;
        for (const ref of sortedCache) {
            responseContent += await getUIC_Ref_Item(ref);
        }
    }

    return {response: responseContent, refCount: countOfRefs};
}


const sortRefCache = async (refCache: Link[]): Promise<Link[]> => {
    return refCache.sort((a,b)=>{
        return a.sourceFile.basename.localeCompare(b.sourceFile.basename) ||
               Number(a.reference.position.start.line) - Number(b.reference.position.start.line);
    });
}
