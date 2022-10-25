// the title displayed at the top of a uic-ref-area

import ThePlugin from "src/main";
import { setFileLinkHandlers } from "./uic-ref--parent";
import {hideAll} from 'tippy.js';

/**
 * Title in HoverView or sidepane
 *
 * @param {string} key
 * @param {string} filePath
 * @param {number} refCount
 * @param {boolean} isPopover
 * @return {*}  {Promise<string>}
 */
export const getUIC_Ref_Title_Div = async (refType: string, key: string, filePath: string, refCount: number, lineNu: number, isPopover:boolean, thePlugin: ThePlugin): Promise<HTMLElement> => {
    const titleEl = createDiv();
    titleEl.addClass(isPopover ? "snw-ref-title-popover" : "snw-ref-title-side-pane");
    titleEl.setAttribute("snw-ref-title-type",  refType);
    titleEl.setAttribute("snw-ref-title-key",   key);
    titleEl.setAttribute("snw-data-file-name",  filePath);
    titleEl.setAttribute("snw-data-line-number",lineNu.toString());
    titleEl.innerText = key;

    if(isPopover) {
        const imgSVG = createSpan();
        imgSVG.innerHTML = titleBarImage;
        const imgWrappper = createSpan();
        imgWrappper.appendChild(imgSVG);
        imgWrappper.addClass("snw-ref-title-popover-open-sidepane-icon");
        imgWrappper.setAttribute("snw-ref-title-type",  refType);
        imgWrappper.setAttribute("snw-ref-title-key",   key);
        imgWrappper.setAttribute("snw-data-file-name",  filePath);
        imgWrappper.setAttribute("snw-data-line-number",lineNu.toString());
        imgWrappper.style.right = "8px";
        imgWrappper.style.top = "5px"
        imgWrappper.style.position = "absolute";
        titleEl.appendChild(imgWrappper);

        //event bindings
        setTimeout( async () => {
            const imgEl: HTMLElement = document.querySelector(".snw-ref-title-popover-open-sidepane-icon");
            if(imgEl) {
                imgEl.onclick = async (e: MouseEvent) => {
                    e.stopPropagation();
                    hideAll({duration: 0}); // hide popup
                    // @ts-ignore
                    const parentEl = e.target.closest(".snw-ref-title-popover-open-sidepane-icon");
                    //open view into side pane
                    const refType = parentEl.getAttribute("snw-ref-title-type")
                    const key = parentEl.getAttribute("snw-ref-title-key")
                    const path = parentEl.getAttribute("snw-data-file-name")
                    const lineNu = parentEl.getAttribute("snw-data-line-number")
                    thePlugin.activateView(refType, key, path, Number(lineNu));
                }
                await setFileLinkHandlers(true);    
            }
        }, 300);
    } //END isPopover

    return titleEl;
}
 
const titleBarImage = `

<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20px" height="20px" viewBox="0 0 20 20" version="1.1">
<g id="surface1">
<path style=" stroke:none;fill-rule:evenodd;fill:rgb(0%,0%,0%);fill-opacity:1;" d="M 14.859375 14.472656 C 14.597656 14.210938 14.597656 13.789062 14.859375 13.53125 L 18.390625 10.003906 L 14.859375 6.476562 C 14.597656 6.214844 14.597656 5.792969 14.859375 5.53125 C 15.121094 5.269531 15.542969 5.269531 15.804688 5.53125 L 19.804688 9.527344 C 20.066406 9.789062 20.066406 10.210938 19.804688 10.46875 L 15.804688 14.472656 C 15.542969 14.734375 15.121094 14.734375 14.859375 14.472656 Z M 14.859375 14.472656 "/>
<path style=" stroke:none;fill-rule:evenodd;fill:rgb(0%,0%,0%);fill-opacity:1;" d="M 5.332031 10 C 5.332031 9.632812 5.628906 9.332031 6 9.332031 L 18 9.332031 C 18.367188 9.332031 18.667969 9.628906 18.667969 10 C 18.667969 10.371094 18.371094 10.667969 18 10.667969 L 6 10.667969 C 5.632812 10.667969 5.332031 10.367188 5.332031 10 Z M 5.332031 10 "/>
<path style=" stroke:none;fill-rule:evenodd;fill:rgb(0%,0%,0%);fill-opacity:1;" d="M 2 17.332031 C 0.894531 17.332031 0 16.4375 0 15.332031 L 0 4.667969 C 0 3.5625 0.894531 2.667969 2 2.667969 L 11.332031 2.667969 C 12.4375 2.667969 13.332031 3.5625 13.332031 4.667969 L 13.332031 6.667969 C 13.332031 7.035156 13.035156 7.335938 12.664062 7.335938 C 12.292969 7.335938 11.996094 7.039062 11.996094 6.667969 L 11.996094 4.667969 C 11.996094 4.300781 11.699219 4 11.328125 4 L 2 4 C 1.632812 4 1.332031 4.296875 1.332031 4.667969 L 1.332031 15.335938 C 1.332031 15.703125 1.628906 16.003906 2 16.003906 L 11.332031 16.003906 C 11.699219 16.003906 12 15.707031 12 15.335938 L 12 13.335938 C 12 12.96875 12.296875 12.667969 12.667969 12.667969 C 13.039062 12.667969 13.335938 12.964844 13.335938 13.335938 L 13.335938 15.335938 C 13.335938 16.441406 12.441406 17.335938 11.335938 17.335938 L 2 17.335938 Z M 2 17.332031 "/>
</g>
</svg>

`;