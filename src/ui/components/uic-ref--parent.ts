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

export const getUIC_Hoverview = async (instance: Instance)=>{
    const {refType, key, filePath} = await getDataElements(instance);
    let output = "";
    output += `<div class="snw-popover-container">`;
    output += await getUIC_Ref_Area(refType, key, filePath, true);
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
            thePlugin.activateView(refType, key, path);
        }
        await setFileLinkHandlers(true);
    }, 300);
}

export const getUIC_SidePane = async (refType: string, key: string, filePath: string): Promise<string> =>{
    let output = "";
    output += `<div class="snw-sidepane-container">`;
    output += await getUIC_Ref_Area(refType, key, filePath, false);
    output += `</div>`;

    setTimeout( async () => {
        await setFileLinkHandlers(false);
    }, 500);

    return output;
}


const setFileLinkHandlers = async (isHoverView: boolean)=>{
    const linksToFiles: NodeList = document.querySelectorAll(".snw-ref-item-file-link");
    linksToFiles.forEach((node: Element)=>{
        if(!node.getAttribute("snw-has-handler")){
            node.setAttribute("snw-has-handler","true"); //prevent the event from being added twice
            node.addEventListener("click", async (e: MouseEvent)=>{
                e.preventDefault(); 
                const LineNu = Number((e.target as HTMLElement).getAttribute("snw-data-line-number"));
                const filePath = (e.target as HTMLElement).getAttribute("snw-data-file-name");
                const fileT = app.metadataCache.getFirstLinkpathDest(filePath, filePath);

                if((e.ctrlKey || e.metaKey) && e.altKey)  
                    thePlugin.app.workspace.getLeaf("split", "horizontal").openFile(fileT);
                else if(e.ctrlKey || e.metaKey)  
                    thePlugin.app.workspace.getLeaf("split", "vertical").openFile(fileT);
                else if(e.altKey)
                    thePlugin.app.workspace.getLeaf("window").openFile(fileT);
                else 
                    thePlugin.app.workspace.getLeaf(false).openFile(fileT);

                setTimeout(() => {
                    thePlugin.app.workspace.getActiveViewOfType(MarkdownView).setEphemeralState({line: LineNu });
                }, 200);
            })
        }
    })
}


const getDataElements = async (instance: Instance): Promise<{refType: string; key: string; filePath: string}> => {
    const parentElement: ReferenceElement = instance.reference;
    const refType   = parentElement.getAttribute("data-snw-type");
    const key       = parentElement.getAttribute("data-snw-key");
    const path      = parentElement.getAttribute("data-snw-filepath")
    return { refType: refType, key: key, filePath: path};
}
