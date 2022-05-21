import {MarkdownPostProcessorContext} from "obsidian";
import {htmlDecorationForReferencesElement} from "./htmlDecorations";
import {getCurrentPage} from "./indexer";
import ThePlugin from "./main";
import {TransformedCachedItem} from "./types";

export function generateArialLabel(filePath: string, refs: TransformedCachedItem) {
    const results = refs.references.filter(r=>filePath!=r.sourceFile.path).map(r=>r.sourceFile.path.replace(".md", ""));
    if(results.length>0)
        return results.join("\n") + "\n-----\n-> CLICK for more details";
    else
        return "";
}

export default function markdownPreviewProcessor(el : HTMLElement, ctx : MarkdownPostProcessorContext, thePlugin : ThePlugin) {
    const CurrentFile = thePlugin.app.vault.fileMap[ctx.sourcePath].path;
    const transformedCache = getCurrentPage(thePlugin.app.vault.fileMap[ctx.sourcePath], thePlugin.app);

    if (transformedCache ?. blocks || transformedCache.embedsWithDuplicates || transformedCache.headings || transformedCache.linksWithoutDuplicates) {
        const sectionInfo = ctx.getSectionInfo(el);
        if (transformedCache ?. blocks) {
            for (const value of transformedCache.blocks) {
                if (value.references.length > 0 && value.pos.end.line === sectionInfo.lineEnd) {
                    const referenceElement = htmlDecorationForReferencesElement(thePlugin, value.references.length, "block", value.key, value.references[0].reference.link, generateArialLabel(CurrentFile, value));
                    let blockElement: HTMLElement = el.querySelector('p')
                    if (! blockElement) {
                        blockElement = el.querySelector("li");
                    }
                    if (! blockElement.hasClass("snw-block-preview")) {
                        blockElement.append(referenceElement);
                        blockElement.addClass("snw-block-preview");
                        break;
                    }
                }
            }
        }

        if (transformedCache ?. embedsWithDuplicates) {
            el.querySelectorAll(".internal-embed:not(.snw-embed-preview)").forEach(element => {
                const embedKey = element.getAttribute('src');
                for (const value of transformedCache.embedsWithDuplicates) {
                    if (value.references.length > 0 && embedKey.endsWith(value.key)) {
                        element.addClass('snw-embed-preview');
                        element.after(htmlDecorationForReferencesElement(thePlugin, value.references.length, "embed", value.key, value.references[0].reference.link, generateArialLabel(CurrentFile, value)));
                        break;
                    }
                }
            });
        }

        if (transformedCache ?. headings && el.querySelector("[data-heading]")) {
            const headerKey = el.querySelector("[data-heading]").textContent;
            for (const value of transformedCache.headings) 
                if (value.references.length > 0 && value.key === headerKey) {
                    const referenceElement = htmlDecorationForReferencesElement(thePlugin, value.references.length, "heading", value.key, value.references[0].reference.link, generateArialLabel(CurrentFile, value));
                    el.querySelector("h1").insertAdjacentElement("beforeend", referenceElement);
                    el.querySelector("h1").addClass("snw-heading-preview");
                    break;
                }
            
        }

        if (transformedCache ?. linksWithoutDuplicates) {
            el.querySelectorAll("a.internal-link:not(.snw-link-preview)").forEach(element => {
                const link = element.getAttribute('data-href');
                for (const value of transformedCache.linksWithoutDuplicates) 
                    if (value.references.length > 0 && value.key === link) {
                        element.addClass('snw-link-preview');
                        element.after(htmlDecorationForReferencesElement(thePlugin, value.references.length, "link", value.key, value.references[0].reference.link, generateArialLabel(CurrentFile, value)));
                        break;
                    }
            });
        }
    }
}
