import { MarkdownView } from 'obsidian';
import ThePlugin from 'src/main';
import { Instance, ReferenceElement } from 'tippy.js';
import { getUIC_Ref_Area, setPluginVariableUIC_RefArea } from "./uic-ref-area";
import { setPluginVariableUIC_RefItem } from './uic-ref-item';

let thePlugin: ThePlugin = null;

export function setPluginVariableForUIC(plugin: ThePlugin) {
    thePlugin = plugin;
    setPluginVariableUIC_RefArea(plugin);
    setPluginVariableUIC_RefItem(plugin);
}


export /**
 * Starting point for the hover popup control. Calls into uic-ref-area, then uic-ref-title and uic-ref-item
 *
 * @param {Instance} instance   the Tippy instance. Tippy provides the floating container.
 */
const getUIC_Hoverview = async (instance: Instance)=>{
    const {refType, key, filePath, lineNu} = await getDataElements(instance);
    let output = "";
    output += `<div class="snw-popover-container">`;
    output += await getUIC_Ref_Area(refType, key, filePath, lineNu, true);
    output += `</div>`;
    instance.setContent(output)

    //event bindings
    setTimeout( async () => {
        const titleElement: HTMLElement = document.querySelector(".snw-ref-title-popover");
        titleElement.onclick = async (e: MouseEvent) => {
            //open view into side pane
            const refType = (e.target as HTMLElement).getAttribute("snw-ref-title-type")
            const key = (e.target as HTMLElement).getAttribute("snw-ref-title-key")
            const path = (e.target as HTMLElement).getAttribute("snw-ref-title-filepath")
            const lineNu = (e.target as HTMLElement).getAttribute("snw-data-line-number")
            thePlugin.activateView(refType, key, path, Number(lineNu));
        }
        await setFileLinkHandlers(true);
    }, 300);
}


export /**
 *  Loads the references into the side pane, using the same logic as the HoverView 
 *
 * @param {string} refType
 * @param {string} key
 * @param {string} filePath
 * @return {*}  {Promise<string>}
 */
const getUIC_SidePane = async (refType: string, key: string, filePath: string, lineNu: number): Promise<string> =>{
    let output = "";
    output += `<div class="snw-sidepane-container">`;
    output += await getUIC_Ref_Area(refType, key, filePath, lineNu, false);
    output += `</div>`;

    setTimeout( async () => {
        await setFileLinkHandlers(false);
    }, 500);

    return output;
}


/**
 * Creates event handlers for components of the HoverView and sidepane
 *
 * @param {boolean} isHoverView
 */
const setFileLinkHandlers = async (isHoverView: boolean)=>{
    const linksToFiles: NodeList = document.querySelectorAll(".snw-ref-item-file, .snw-ref-item-info, .snw-ref-title-side-pane, .snw-ref-title-popover");
    linksToFiles.forEach((node: Element)=>{
        if(!node.getAttribute("snw-has-handler")){
            node.setAttribute("snw-has-handler","true"); //prevent the event from being added twice
            node.addEventListener("click", async (e: MouseEvent)=>{
                e.preventDefault(); 
                const handlerElement = (e.target as HTMLElement).closest(".snw-ref-item-file, .snw-ref-item-info, .snw-ref-title-side-pane, .snw-ref-title-popover");
                const LineNu = Number(handlerElement.getAttribute("snw-data-line-number"));
                const filePath = handlerElement.getAttribute("snw-data-file-name");

                console.log("line", LineNu)
                console.log("filePath", filePath)

                const fileT = app.metadataCache.getFirstLinkpathDest(filePath, filePath);
                
                if((e.ctrlKey || e.metaKey) && e.altKey)  
                    thePlugin.app.workspace.getLeaf("split", "horizontal").openFile(fileT);
                else if(e.ctrlKey || e.metaKey)  
                    thePlugin.app.workspace.getLeaf("split", "vertical").openFile(fileT);
                else if(e.altKey)
                    thePlugin.app.workspace.getLeaf("window").openFile(fileT);
                else 
                    thePlugin.app.workspace.getLeaf(false).openFile(fileT);

                if(LineNu>0) {
                    setTimeout(() => {
                        // jumps to the line of the file where the reference is located
                        thePlugin.app.workspace.getActiveViewOfType(MarkdownView).setEphemeralState({line: LineNu });
                    }, 400);
                }
            })
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
    const path      = parentElement.getAttribute("data-snw-filepath")
    const lineNu   = parentElement.getAttribute("snw-data-line-number")
    return { refType: refType, key: key, filePath: path, lineNu: lineNu};
}
