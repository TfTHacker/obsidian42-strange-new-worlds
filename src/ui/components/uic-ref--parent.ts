import { Keymap, MarkdownView } from 'obsidian';
import SNWPlugin from 'src/main';
import { Instance, ReferenceElement } from 'tippy.js';
import { getUIC_Ref_Area } from "./uic-ref-area";
import { setPluginVariableUIC_RefItem } from './uic-ref-item';

let thePlugin: SNWPlugin = null;

export function setPluginVariableForUIC(plugin: SNWPlugin) {
    thePlugin = plugin;
    setPluginVariableUIC_RefItem(plugin);
}


/**
 * Starting point for the hover popup control. Calls into uic-ref-area, then uic-ref-title and uic-ref-item
 *
 * @param {Instance} instance   the Tippy instance. Tippy provides the floating container.
 */
export const getUIC_Hoverview = async (instance: Instance)=>{
    const {refType, key, filePath, lineNu} = await getDataElements(instance);
    const popoverEl = createDiv();
    popoverEl.addClass("snw-popover-container");
    popoverEl.addClass("search-result-container")
    popoverEl.appendChild( await getUIC_Ref_Area(refType, key, filePath, lineNu, true));
    instance.setContent(popoverEl);
    setTimeout( async () => {
        await setFileLinkHandlers(false, popoverEl);
    }, 500);
}
 

export /**
 *  Loads the references into the side pane, using the same logic as the HoverView 
 *
 * @param {string} refType
 * @param {string} key
 * @param {string} filePath
 * @return {*}  {Promise<string>}
 */
const getUIC_SidePane = async (refType: string, key: string, filePath: string, lineNu: number): Promise<HTMLElement> =>{
    const sidepaneEL = createDiv();
    sidepaneEL.addClass("snw-sidepane-container");   
    sidepaneEL.addClass("search-result-container");
    sidepaneEL.append( (await getUIC_Ref_Area(refType, key, filePath, lineNu, false)) )
 
    setTimeout( async () => {
        await setFileLinkHandlers(false, sidepaneEL);
    }, 500);

    return sidepaneEL
}


/**
 * Creates event handlers for components of the HoverView and sidepane
 *
 * @param {boolean} isHoverView
 */
export const setFileLinkHandlers = async (isHoverView: boolean, rootElementForViewEl: HTMLElement)=>{
    const linksToFiles: NodeList = rootElementForViewEl.querySelectorAll(".snw-ref-item-file, .snw-ref-item-info, .snw-ref-title-side-pane, .snw-ref-title-popover");
    linksToFiles.forEach((node: Element)=>{
        if(!node.getAttribute("snw-has-handler")){
            node.setAttribute("snw-has-handler","true"); //prevent the event from being added twice
            // CLICK event
            node.addEventListener("click", async (e: MouseEvent)=>{
                e.preventDefault(); 
                const handlerElement = (e.target as HTMLElement).closest(".snw-ref-item-file, .snw-ref-item-info, .snw-ref-title-side-pane, .snw-ref-title-popover");
                let lineNu = Number(handlerElement.getAttribute("snw-data-line-number"));
                const filePath = handlerElement.getAttribute("snw-data-file-name");
                const fileT = app.metadataCache.getFirstLinkpathDest(filePath, filePath);
                
                thePlugin.app.workspace.getLeaf(Keymap.isModEvent(e)).openFile(fileT);

                // for file titles, the embed handling for titles related to block id's and headers is hard to calculate, so its more efficient to do it here
                const titleKey = handlerElement.getAttribute("snw-ref-title-key");
                if(titleKey){
                    if(titleKey.contains("#^")) { // links to a block id
                        const destinationBlocks = Object.entries((thePlugin.app.metadataCache.getFileCache(fileT)?.blocks));
                        if(destinationBlocks){
                            const blockID = titleKey.match(/#\^(.+)$/g)[0].replace("#^","").toLowerCase();
                            const l = destinationBlocks.find(b=> b[0]===blockID);
                            lineNu = l[1].position.start.line;    
                        }
                    } else if(titleKey.contains("#")) { // possibly links to a header
                        const destinationHeadings = (thePlugin.app.metadataCache.getFileCache(fileT)?.headings);
                        if(destinationHeadings){
                            const headingKey = titleKey.match(/#(.+)/g)[0].replace("#","");
                            const l = destinationHeadings.find(h=> h.heading===headingKey);
                            lineNu = l.position.start.line;
                        }
                    }
                }

                if(lineNu>0) {
                    setTimeout(() => {
                        // jumps to the line of the file where the reference is located
                        try {
                            thePlugin.app.workspace.getActiveViewOfType(MarkdownView).setEphemeralState({line: lineNu });
                        } catch (error) { /* Do nothing */ }
                    }, 400);
                }
            })
            // mouseover event
            // @ts-ignore
            if(thePlugin.app.internalPlugins.plugins['page-preview'].enabled===true) {
                node.addEventListener('mouseover', (e: PointerEvent) => {
                    e.preventDefault();
                    // @ts-ignore
                    const hoverMetaKeyRequired = app.internalPlugins.plugins['page-preview'].instance.overrides['obsidian42-strange-new-worlds']==false ? false : true;
                    if( hoverMetaKeyRequired===false || (hoverMetaKeyRequired===true && Keymap.isModifier(e,"Mod")) ) {
                        const target = e.target as HTMLElement;
                        const previewLocation = { scroll: Number(target.getAttribute("snw-data-line-number")) };
                        const filePath  = target.getAttribute("snw-data-file-name");
                        if(filePath) {
                            // parameter signature for link-hover parent: HoverParent, targetEl: HTMLElement, linkText: string, sourcePath: string, eState: EphemeralState
                            app.workspace.trigger( "link-hover", {}, target, filePath, "", previewLocation);   
                        }
                    }
                });    
            }

            
        }
    })
}


/**
 * Utility function to extact key data points from the Tippy instance
 *
 * @param {Instance} instance
 * @return {*}  {Promise<{refType: string; key: string; filePath: string}>}
 */
const getDataElements = async (instance: Instance): Promise<{refType: string; key: string; filePath: string, lineNu: number}> => {
    const parentElement: ReferenceElement = instance.reference;
    const refType   = parentElement.getAttribute("data-snw-type");
    const key       = parentElement.getAttribute("data-snw-key");
    const path      = parentElement.getAttribute("data-snw-filepath");
    const lineNum   = Number(parentElement.getAttribute("snw-data-line-number")); 
    return { refType: refType, key: key, filePath: path, lineNu: lineNum};
}
