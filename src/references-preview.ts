import {MarkdownPostProcessorContext} from "obsidian";
import {htmlDecorationForReferencesElement} from "./htmlDecorations";
import {getCurrentPage} from "./indexer";
import ThePlugin from "./main";
import {TransformedCachedItem} from "./types";

/**
 * Function called by main.registerMarkdownPostProcessor - this function renders the html when in preview mode
 *
 * This function receives a section of the document for processsing. So this function is called many times for a document.
 * 
 * @export
 * @param {HTMLElement} el
 * @param {MarkdownPostProcessorContext} ctx
 * @param {ThePlugin} thePlugin
 * @return {*} 
 */
export default function markdownPreviewProcessor(el : HTMLElement, ctx : MarkdownPostProcessorContext, thePlugin : ThePlugin) {

    if(thePlugin.snwAPI.enableDebugging.PreviewRendering)
        thePlugin.snwAPI.console("markdownPreviewProcessor(HTMLElement, MarkdownPostProcessorContext", el, ctx, ctx.getSectionInfo(el))

    const currentFile = thePlugin.app.vault.fileMap[ctx.sourcePath];
    // check for incompatibility with other plugins
    if(app.metadataCache.getFileCache(currentFile)?.frontmatter?.["kanban-plugin"] ) return; //no support for kanban board
    
    const currentFilePath = currentFile.path;
    const transformedCache = getCurrentPage(currentFile, thePlugin.app);

    if (transformedCache?.blocks || transformedCache.embedsWithDuplicates || transformedCache.headings || transformedCache.linksWithoutDuplicates) {
        const sectionInfo = ctx.getSectionInfo(el);

        if (transformedCache?.blocks) {
            let isThisAnEmbed = false;
            try { // we don't want to proccess embeds
                // @ts-ignore
                isThisAnEmbed = ctx.containerEl.closest(".snw-embed-preview").nextSibling.classList.contains("snw-reference");
            } catch (error) { /* nothing to do here */ }
            
            for (const value of transformedCache.blocks) {
                if ( value.references.length > 0 && 
                     (value.pos.start.line >= sectionInfo?.lineStart && value.pos.end.line <= sectionInfo?.lineEnd) &&
                     !isThisAnEmbed ) {
                        const referenceElement = htmlDecorationForReferencesElement(thePlugin, value.references.length, "block", value.key, value.references[0].reference.link, generateArialLabel(currentFilePath, value), "");
                    let blockElement: HTMLElement = el.querySelector('p')
                    if (!blockElement) {
                        blockElement = el.querySelector("li");
                    }
                    try {
                        if (!blockElement.hasClass("snw-block-preview")) {
                            blockElement.append(referenceElement);
                            referenceElement.addClass("snw-block-preview");
                            break;
                        } 
                    } catch (error) { /* nothing to do here */ }
                }
            }
        }

        if (transformedCache?.embeds?.length > 0) {
            el.querySelectorAll(".internal-embed:not(.snw-embed-preview)").forEach(element => {
                const embedKey = element.getAttribute('src');
                for (const value of transformedCache.embedsWithDuplicates) {
                    if (value.references.length > 0 && embedKey.endsWith(value.key)) {
                        const referenceElement = htmlDecorationForReferencesElement(thePlugin, value.references.length, "embed", value.key, value.references[0].reference.link, generateArialLabel(currentFilePath, value), "");
                        element.after(referenceElement);
                        referenceElement.addClass('snw-embed-preview');
                        break;
                    }
                }
            });
        }

        if (transformedCache?.headings?.length > 0 && el.querySelector("[data-heading]")) {
            const headerKey = el.querySelector("[data-heading]").textContent;
            for (const value of transformedCache.headings) 
                if (value.references.length > 0 && value.key === headerKey) {
                    const referenceElement = htmlDecorationForReferencesElement(thePlugin, value.references.length, "heading", value.key, value.references[0].reference.link, generateArialLabel(currentFilePath, value), "");
                    el.querySelector("h1").insertAdjacentElement("beforeend", referenceElement);
                    referenceElement.addClass("snw-heading-preview");
                    break;
                }
        }

        if (transformedCache?.linksWithoutDuplicates?.length > 0) {
            el.querySelectorAll("a.internal-link:not(.snw-link-preview)").forEach(element => {
                const link = element.getAttribute('data-href');
                for (const value of transformedCache.linksWithoutDuplicates) {
                    if (value.references.length > 0 && (value.key === link || value.original.includes(link))) {
                        const referenceElement = htmlDecorationForReferencesElement(thePlugin, value.references.length, "link", value.key, value.references[0].reference.link, generateArialLabel(currentFilePath, value), "");
                        element.after(referenceElement);
                        referenceElement.addClass('snw-link-preview');
                        break;
                    }
                }
            });
        }
    }
}

/**
 * Provides the tooltip for references displayed in the document
 *
 * @export
 * @param {string} filePath
 * @param {TransformedCachedItem} refs
 * @return {*} 
 */
export function generateArialLabel(filePath: string, refs: TransformedCachedItem) {
    const results = refs.references.filter(r=>filePath!=r.sourceFile.path).map(r=>r.sourceFile.path.replace(".md", ""));
    if(results.length>0)
        return results.join("\n") + "\n-----\n-> CLICK for more details";
    else
        return "";
}