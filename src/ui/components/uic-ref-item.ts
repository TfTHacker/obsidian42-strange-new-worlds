import { MarkdownRenderer, Pos, TFile } from "obsidian";
import ThePlugin from "src/main";
import { Link } from "../../types";

let thePlugin: ThePlugin;

export function setPluginVariableUIC_RefItem(plugin: ThePlugin) {
    thePlugin = plugin;
}

export /**
 * Creats an individual reference item
 *
 * @param {Link} ref
 * @return {*}  {Promise<string>}
 */
const getUIC_Ref_Item = async (ref: Link): Promise<string>=> {
    let response = "";
        response += `<div class="snw-ref-item-info" 
                          snw-data-line-number="${ref.reference.position.start.line}" 
                          snw-data-file-name="${ref.sourceFile.path}"
                          data-href="${ref   .sourceFile.path}">`;
        response += await grabChunkOfFile(ref.sourceFile, ref.reference.position);
        response += `</div>`; // END of snw-ref-item-info
        return response;
}


/**
 * Grabs a block from a file, then runs it through a markdown render
 *
 * @param {TFile} file
 * @param {Pos} position
 * @return {*}  {Promise<string>}
 */
const grabChunkOfFile = async (file: TFile, position: Pos): Promise<string> =>{
    const fileContents = await thePlugin.app.vault.cachedRead(file)
    const cachedMetaData = thePlugin.app.metadataCache.getFileCache(file);

    let startPosition = 0;
    let endPosition = 0;

    for (let i = 0; i < cachedMetaData.sections.length; i++) {
        const sec = cachedMetaData.sections[i];
        if(sec.position.start.offset<=position.start.offset && sec.position.end.offset>=position.end.offset) {
            startPosition = sec.position.start.offset;
            endPosition = sec.position.end.offset;
            break;
        }
    }

    const blockContents = fileContents.substring(startPosition, endPosition);

    const el = document.createElement("div");
    el.setAttribute("uic","uic")  //used to track if this is UIC element. 
    await MarkdownRenderer.renderMarkdown(blockContents, el, file.path, thePlugin)

    return el.innerHTML
}
