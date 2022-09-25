import ThePlugin from 'src/main';
import { Instance, ReferenceElement } from 'tippy.js';
import { getUIC_Ref_Area, setPluginVariableUIC_RefArea } from "./uic-ref-area";
import { setPluginVariableUIC_RefItem } from './uic-ref-item';


export function setPluginVariableForUIC(plugin: ThePlugin) {
    setPluginVariableUIC_RefArea(plugin);
    setPluginVariableUIC_RefItem(plugin);
}

export const getUIC_PopOver = async (instance: Instance)=>{
    const {refType, key, link} = await getDataElements(instance);
    let output = "";
    output += `<div class="snw-popover-container">`;
    output += await getUIC_Ref_Area(refType, key, link, true);
    output += `</div>`;
    console.log(output)
    instance.setContent(output)
}

export const getUIC_SidePane = async ()=>{
    
}

const getDataElements = async (instance: Instance): Promise<{refType: string; key: string; link: string}> => {
    const parentElement: ReferenceElement = instance.reference;
    const refType   = parentElement.getAttribute("data-snw-type");
    const key       = parentElement.getAttribute("data-snw-key");
    const link      = parentElement.getAttribute("data-snw-link")
    return { refType: refType, key: key, link: link};
}
