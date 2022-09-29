// the title displayed at the top of a uic-ref-area

export /**
 * Title in HoverView or sidepane
 *
 * @param {string} key
 * @param {string} filePath
 * @param {number} refCount
 * @param {boolean} isPopover
 * @return {*}  {Promise<string>}
 */
const getUIC_Ref_Title_DivStart = async (key: string, filePath: string, refCount: number, isPopover:boolean): Promise<string> => {
    const titleClass = isPopover ? "snw-ref-title-popover" : "snw-ref-title-side-pane";
    return `<div class="${titleClass}" snw-ref-title-key="${key}" snw-data-file-name="${filePath}">${key}`;
}


export const getUIC_ref_title_DivEnd = async (): Promise<string> => {
    return "</div>";
}