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
    const titleClass = isPopover ? "snw-ref-title-popover" : "snw-ref-title-side-pane";
    console.log("title", key,filePath,refCount,lineNu,isPopover)
    return `<div class="${titleClass}" snw-ref-title-key="${key}" snw-data-file-name="${filePath}" snw-data-line-number="${lineNu}">${key}</div>`;
}