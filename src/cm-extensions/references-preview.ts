import {MarkdownPostProcessorContext} from "obsidian";
import {htmlDecorationForReferencesElement} from "./htmlDecorations";
import {getCurrentPage} from "../indexer";
import ThePlugin from "../main";


let thePlugin: ThePlugin;

export function setPluginVariableForMarkdownPreviewProcessor(plugin: ThePlugin) {
    thePlugin = plugin;
}

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
export default function markdownPreviewProcessor(el : HTMLElement, ctx : MarkdownPostProcessorContext) {

    // @ts-ignore
    if(ctx.remainingNestLevel===4) return;  // This is an attempt to prevent processing of embed files

    if(el.hasAttribute("uic")) return; // this is a custom component, don't render SNW inside it.

    if(thePlugin.snwAPI.enableDebugging.PreviewRendering)
        thePlugin.snwAPI.console("markdownPreviewProcessor(HTMLElement, MarkdownPostProcessorContext,ctx.getSectionInfo", el, ctx, ctx.getSectionInfo(el))

    const currentFile = thePlugin.app.vault.fileMap[ctx.sourcePath];
    // check for incompatibility with other plugins
    if(app.metadataCache.getFileCache(currentFile)?.frontmatter?.["kanban-plugin"] ) return; //no support for kanban board
    
    const transformedCache = getCurrentPage(currentFile);

    if (transformedCache?.blocks || transformedCache.embeds || transformedCache.headings || transformedCache.links) {
        const sectionInfo = ctx.getSectionInfo(el);

        if (thePlugin.settings.enableRenderingBlockIdInMarkdown && transformedCache?.blocks) {
            let isThisAnEmbed = false;
            try { // we don't want to proccess embeds
                // @ts-ignore
                isThisAnEmbed = ctx.containerEl.closest(".snw-embed-preview").nextSibling.classList.contains("snw-reference");
            } catch (error) { /* nothing to do here */ }
            
            for (const value of transformedCache.blocks) {
                if ( value.references.length > 0 && 
                     (value.pos.start.line >= sectionInfo?.lineStart && value.pos.end.line <= sectionInfo?.lineEnd) &&
                     !isThisAnEmbed ) {
                        const referenceElement = htmlDecorationForReferencesElement(value.references.length, "block", value.key, value.references[0].reference.link, "");
                    let blockElement: HTMLElement = el.querySelector('p')
                    if (!blockElement) {
                        blockElement = el.querySelector("li");
                    }
                    try {
                        if (!blockElement.hasClass("snw-block-preview")) {
                            referenceElement.addClass("snw-block-preview");
                            blockElement.append(referenceElement);
                            break;
                        } 
                    } catch (error) { /* nothing to do here */ }
                }
            }
        }

        if (thePlugin.settings.enableRenderingEmbedsInMarkdown && transformedCache?.embeds) {
            el.querySelectorAll(".internal-embed:not(.snw-embed-preview)").forEach(element => {
                const embedKey = element.getAttribute('src');
                for (const value of transformedCache.embeds) {
                    if (value.references.length > 0 && embedKey.endsWith(value.key)) {
                        const referenceElement = htmlDecorationForReferencesElement(value.references.length, "embed", value.key, value.references[0].reference.link, "");
                        referenceElement.addClass('snw-embed-preview');
                        element.after(referenceElement);
                        break;
                    }
                }
            });
        }

        if(thePlugin.settings.enableRenderingHeadersInMarkdown) {
            const headerKey = el.querySelector("[data-heading]");
            if (transformedCache?.headings && headerKey) {
                const textContext = headerKey.textContent
                for (const value of transformedCache.headings) 
                    if (value.references.length > 0 && value.key === textContext) {
                        const referenceElement = htmlDecorationForReferencesElement(value.references.length, "heading", value.key, value.references[0].reference.link, "");
                        referenceElement.addClass("snw-heading-preview");
                        el.querySelector("h1,h2,h3,h4,h5,h6").insertAdjacentElement("beforeend", referenceElement);                        
                        break;
                    }
            }
        }

        if(thePlugin.settings.enableRenderingLinksInMarkdown && transformedCache?.links) {
            el.querySelectorAll("a.internal-link:not(.snw-link-preview)").forEach(element => {
                const link = element.getAttribute('data-href');
                for (const value of transformedCache.links) {
                    if (value.references.length > 0 && (value.key === link || value.original.includes(link))) {
                        const referenceElement = htmlDecorationForReferencesElement(value.references.length, "link", value.key, value.references[0].reference.link, "");
                        referenceElement.addClass('snw-link-preview');
                        element.after(referenceElement);
                        break;
                    }
                }
            });
        }
    }
}
