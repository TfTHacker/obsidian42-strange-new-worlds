import { Notice } from "obsidian";

export default function htmlReferenceElement(count: number, referenceType: string, key: string): HTMLElement {
    const element = document.createElement("span")
    element.className = "snw-reference snw-" + referenceType;
    element.innerText= " " + count.toString() + " ";
    element.setAttribute("data-snw-key", key);
    element.setAttribute("data-snw-type", referenceType);
    element.onclick = (e) => {
        const key = e.target.getAttribute("data-snw-key");
        const refType = e.target.getAttribute("data-snw-type");
        console.log('click ' + refType + " " + key )
        new Notice("clicked me " + refType + " " + key)
    }
        
    return element;

}