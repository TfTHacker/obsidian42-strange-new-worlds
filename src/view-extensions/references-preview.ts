import {MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownSectionInformation, TFile} from "obsidian";
import {htmlDecorationForReferencesElement} from "./htmlDecorations";
import {getSNWCacheByFile} from "../indexer";
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

    if(thePlugin.snwAPI.enableDebugging.PreviewRendering)
        thePlugin.snwAPI.console("markdownPreviewProcessor(HTMLElement, MarkdownPostProcessorContext,ctx.getSectionInfo", el, ctx, ctx.getSectionInfo(el))

    // @ts-ignore
    if(ctx.remainingNestLevel===4) return;  // This is an attempt to prevent processing of embed files

    if(el.hasAttribute("uic")) return; // this is a custom component, don't render SNW inside it.

    const currentFile = thePlugin.app.vault.fileMap[ctx.sourcePath];
    // check for incompatibility with other plugins
    if(thePlugin.app.metadataCache.getFileCache(currentFile)?.frontmatter?.["kanban-plugin"] ) return; //no support for kanban board
    
    ctx.addChild(new snwChildComponent(el, ctx.getSectionInfo(el), currentFile ));

}


class snwChildComponent extends MarkdownRenderChild {
    containerEl: HTMLElement;
    sectionInfo: MarkdownSectionInformation;
    currentFile: TFile

    constructor(containerEl: HTMLElement, sectionInfo: MarkdownSectionInformation, currentFile: TFile) {
        super(containerEl);
        this.containerEl = containerEl;
        this.sectionInfo = sectionInfo;
        this.currentFile = currentFile;
        if(thePlugin.snwAPI.enableDebugging.PreviewRendering)
            thePlugin.snwAPI.console("snwChildComponent(HTMLElement, MarkdownPostProcessorContext,currentfile", containerEl, sectionInfo, currentFile)
    }

    onload(): void {
        this.processMarkdown()
    }

    processMarkdown(): void {
        const minRefCountThreshold = thePlugin.settings.minimumRefCountThreshold;
        const transformedCache = getSNWCacheByFile(this.currentFile);

        if (transformedCache?.blocks || transformedCache.embeds || transformedCache.headings || transformedCache.links) {

            if (thePlugin.settings.enableRenderingBlockIdInMarkdown && transformedCache?.blocks) {
                let isThisAnEmbed = false;
                try { // we don't want to proccess embeds
                    // @ts-ignore
                    isThisAnEmbed = ctx.containerEl.closest(".snw-embed-preview").nextSibling.classList.contains("snw-reference");
                } catch (error) { /* nothing to do here */ }
                
                for (const value of transformedCache.blocks) {
                    if ( value.references.length >= minRefCountThreshold && 
                        (value.pos.start.line >= this.sectionInfo?.lineStart && value.pos.end.line <= this.sectionInfo?.lineEnd) &&
                        !isThisAnEmbed ) {
                        const referenceElement = htmlDecorationForReferencesElement(value.references.length, "block", value.key, value.references[0].resolvedFile.path.replace(".md",""), "", value.pos.start.line);
                        let blockElement: HTMLElement = this.containerEl.querySelector('p')
                        if (!blockElement) {
                            blockElement = this.containerEl.querySelector("li");
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
                this.containerEl.querySelectorAll(".internal-embed:not(.snw-embed-preview)").forEach(element => {
                    const embedKey = element.getAttribute('src');
                    for (const value of transformedCache.embeds) {
                        if (value.references.length >= minRefCountThreshold && embedKey.endsWith(value.key)) {
                            const referenceElement = htmlDecorationForReferencesElement(value.references.length, "embed", value.key, value.references[0].resolvedFile.path.replace(".md",""), "", value.pos.start.line);
                            referenceElement.addClass('snw-embed-preview');
                            element.after(referenceElement);
                            break;
                        }
                    }
                });
            }

            if(thePlugin.settings.enableRenderingHeadersInMarkdown) {
                const headerKey = this.containerEl.querySelector("[data-heading]");
                if (transformedCache?.headings && headerKey) {
                    const textContext = headerKey.getAttribute("data-heading")
                    for (const value of transformedCache.headings)  {
                        if (value.references.length >= minRefCountThreshold && value.headerMatch === textContext) {
                            const referenceElement = htmlDecorationForReferencesElement(value.references.length, "heading", value.key, value.references[0].resolvedFile.path.replace(".md",""), "", value.pos.start.line);
                            referenceElement.addClass("snw-heading-preview");
                            this.containerEl.querySelector("h1,h2,h3,h4,h5,h6").insertAdjacentElement("beforeend", referenceElement);                        
                            break;
                        }
                    }
                }
            }

            if(thePlugin.settings.enableRenderingLinksInMarkdown && transformedCache?.links) {
                this.containerEl.querySelectorAll("a.internal-link:not(.snw-link-preview)").forEach(element => {
                    const link = element.getAttribute('data-href');
                    for (const value of transformedCache.links) {
                        if (value.references.length >= minRefCountThreshold && (value.key === link || (value?.original!=undefined && value?.original.contains(link)))) {
                            const referenceElement = htmlDecorationForReferencesElement(value.references.length, "link", value.key, value.references[0].resolvedFile.path.replace(".md",""), "", value.pos.start.line);
                            referenceElement.addClass('snw-link-preview');
                            element.after(referenceElement);
                            break;
                        }
                    }
                });
            }
        } 
    }

}
