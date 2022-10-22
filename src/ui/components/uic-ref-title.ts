// the title displayed at the top of a uic-ref-area

/**
 * Title in HoverView or sidepane
 *
 * @param {string} key
 * @param {string} filePath
 * @param {number} refCount
 * @param {boolean} isPopover
 * @return {*}  {Promise<string>}
 */
export const getUIC_Ref_Title_Div = async (key: string, filePath: string, refCount: number, lineNu: number, isPopover:boolean): Promise<string> => {
    const titleEl = createDiv();
    titleEl.addClass(isPopover ? "snw-ref-title-popover" : "snw-ref-title-side-pane");
    titleEl.setAttribute("snw-ref-title-key",   key);
    titleEl.setAttribute("snw-data-file-name",  filePath);
    titleEl.setAttribute("snw-data-line-number", lineNu.toString());
    titleEl.innerText = key;
    return titleEl.outerHTML;
}