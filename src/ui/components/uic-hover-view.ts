import ThePlugin from 'src/main';
import { Instance, ReferenceElement } from 'tippy.js';
import { getUIC_Ref_Area, setPluginVariableUIC_RefArea } from "./uic-ref-area";
import { setPluginVariableUIC_RefItem } from './uic-ref-item';


export function setPluginVariableForUIC(plugin: ThePlugin) {
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
        const titleElement: HTMLElement = document.querySelector(".snw-ref-title");
        titleElement.onclick = async (e: MouseEvent) => {
            const key = (e.target as HTMLElement).getAttribute("snw-ref-title-key")
            const path = (e.target as HTMLElement).getAttribute("snw-ref-title-filepath")
        }
    }, 200);
}

export const getUIC_SidePane = async ()=>{
    
}

const getDataElements = async (instance: Instance): Promise<{refType: string; key: string; filePath: string}> => {
    const parentElement: ReferenceElement = instance.reference;
    const refType   = parentElement.getAttribute("data-snw-type");
    const key       = parentElement.getAttribute("data-snw-key");
    const path      = parentElement.getAttribute("data-snw-filepath")
    return { refType: refType, key: key, filePath: path};
}
