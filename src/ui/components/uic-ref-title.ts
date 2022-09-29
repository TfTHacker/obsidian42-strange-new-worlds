// the title displayed at the top of a uic-ref-area

export const getUIC_Ref_Title_DivStart = async (key: string, filePath: string, refCount: number, isPopover:boolean): Promise<string> => {
    const titleClass = isPopover ? "snw-ref-title-popover" : "snw-ref-title-side-pane";
    return `<div class="${titleClass}" snw-ref-title-key="${key}" snw-ref-title-filepath="${filePath}">
            References for: ${key}`;
}


export const getUIC_ref_title_DivEnd = async (): Promise<string> => {
    return "</div>";
}