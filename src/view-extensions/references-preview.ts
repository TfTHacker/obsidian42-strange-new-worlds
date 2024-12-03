import {
	type MarkdownPostProcessorContext,
	MarkdownRenderChild,
	type MarkdownSectionInformation,
	parseLinktext,
	type TFile,
} from "obsidian";
import { getSNWCacheByFile, parseLinkTextToFullPath } from "../indexer";
import type SNWPlugin from "../main";
import { htmlDecorationForReferencesElement } from "./htmlDecorations";
import SnwAPI from "src/snwApi";

let plugin: SNWPlugin;

export function setPluginVariableForMarkdownPreviewProcessor(snwPlugin: SNWPlugin) {
	plugin = snwPlugin;
}

/**
 * Function called by main.registerMarkdownPostProcessor - this function renders the html when in preview mode
 * This function receives a section of the document for processsing. So this function is called many times for a document.
 */
export default function markdownPreviewProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
	// @ts-ignore
	if (ctx.remainingNestLevel === 4) return; // This is an attempt to prevent processing of embed files

	if (el.hasAttribute("uic")) return; // this is a custom component, don't render SNW inside it.

	// The following line addresses a conflict with the popular Tasks plugin.
	// if ( el.querySelectorAll(".contains-task-list").length > 0) return;

	const currentFile = plugin.app.vault.fileMap[ctx.sourcePath];
	// try {
	if (currentFile === undefined) {
		ctx.addChild(new snwChildComponentMardkownWithoutFile(el));
	} else {
		// check for incompatibility with other plugins
		const fileCache = plugin.app.metadataCache.getFileCache(currentFile);
		if (plugin.settings.pluginSupportKanban === false && fileCache?.frontmatter?.["kanban-plugin"]) return;
		// || ctx.el.parentElement?.classList.contains("kanban-plugin__markdown-preview-view")
		ctx.addChild(new snwChildComponentForMarkdownFile(el, ctx.getSectionInfo(el), currentFile));
	}
	// } catch (error) {}
}

// Processes pure markdown not coming from a document, like a card on a canvas that is not based on a file
class snwChildComponentMardkownWithoutFile extends MarkdownRenderChild {
	containerEl: HTMLElement;

	constructor(containerEl: HTMLElement) {
		super(containerEl);
		this.containerEl = containerEl;
	}

	onload(): void {
		for (const link of Array.from(this.containerEl.querySelectorAll("a.internal-link, span.internal-embed"))) {
			const ref = ((link as HTMLElement).dataset.href || link.getAttribute("src")) as string;
			const key = parseLinkTextToFullPath(ref).toLocaleUpperCase();
			const resolvedTFile = plugin.app.metadataCache.getFirstLinkpathDest(parseLinktext(ref).path, "/");
			// const key
			const references = plugin.snwAPI.references.get(key);

			const refCount = references?.length || 0;
			if (refCount <= 0 || refCount < plugin.settings.minimumRefCountThreshold) continue;

			const refType = link.classList.contains("internal-link") ? "link" : "embed";
			if (!resolvedTFile) continue;

			const referenceElement = htmlDecorationForReferencesElement(
				refCount,
				refType,
				ref,
				key,
				resolvedTFile.path,
				`snw-liveupdate snw-${refType}-preview`,
				1,
			);
			link.after(referenceElement);
		}
	}
}

// Processes markdown coming from a markdown file
class snwChildComponentForMarkdownFile extends MarkdownRenderChild {
	containerEl: HTMLElement;
	sectionInfo: MarkdownSectionInformation;
	currentFile: TFile;

	constructor(containerEl: HTMLElement, sectionInfo: MarkdownSectionInformation, currentFile: TFile) {
		super(containerEl);
		this.containerEl = containerEl;
		this.sectionInfo = sectionInfo;
		this.currentFile = currentFile;
	}

	onload(): void {
		const minRefCountThreshold = plugin.settings.minimumRefCountThreshold;
		const transformedCache = getSNWCacheByFile(this.currentFile);

		if (transformedCache?.cacheMetaData?.frontmatter?.["snw-file-exclude"] === true) return;
		if (transformedCache?.cacheMetaData?.frontmatter?.["snw-canvas-exclude-preview"] === true) return;

		if (transformedCache?.blocks || transformedCache.embeds || transformedCache.headings || transformedCache.links) {
			if (plugin.settings.enableRenderingBlockIdInMarkdown && transformedCache?.blocks) {
				for (const value of transformedCache.blocks) {
					if (
						value.references.length >= minRefCountThreshold &&
						value.pos.start.line >= this.sectionInfo?.lineStart &&
						value.pos.end.line <= this.sectionInfo?.lineEnd
					) {
						const referenceElement = htmlDecorationForReferencesElement(
							value.references.length,
							"block",
							value.references[0].realLink,
							value.key,
							value.references[0]?.resolvedFile?.path.replace(`.${value.references[0]?.resolvedFile?.path}`, ""),
							"snw-liveupdate",
							value.pos.start.line,
						);
						let blockElement: HTMLElement = this.containerEl.querySelector("p");
						const valueLineInSection: number = value.pos.start.line - this.sectionInfo.lineStart;
						if (!blockElement) {
							blockElement = this.containerEl.querySelector(`li[data-line="${valueLineInSection}"]`);
							if (blockElement.querySelector("ul")) blockElement.querySelector("ul").before(referenceElement);
							else blockElement.append(referenceElement);
						} else {
							if (!blockElement) {
								blockElement = this.containerEl.querySelector(`ol[data-line="${valueLineInSection}"]`);
								blockElement.append(referenceElement);
							} else {
								blockElement.append(referenceElement);
							}
						}
						try {
							if (!blockElement.hasClass("snw-block-preview")) {
								referenceElement.addClass("snw-block-preview");
							}
						} catch (error) {
							/* nothing to do here */
						}
					}
				}
			}

			if (plugin.settings.enableRenderingEmbedsInMarkdown && transformedCache?.embeds) {
				// biome-ignore lint/complexity/noForEach: <explanation>
				this.containerEl.querySelectorAll(".internal-embed:not(.snw-embed-preview)").forEach((element) => {
					const src = element.getAttribute("src");
					if (!src) return;

					// Testing for normal links, links within same page starting with # and for ghost links
					const embedKey =
						parseLinkTextToFullPath(
							src[0] === "#" ? this.currentFile.path.slice(0, -(this.currentFile.extension.length + 1)) + src : src,
						) || src;

					for (const value of transformedCache.embeds ?? []) {
						if (value.references.length >= minRefCountThreshold && embedKey.toLocaleUpperCase() === value.key.toLocaleUpperCase()) {
							const referenceElement = htmlDecorationForReferencesElement(
								value.references.length,
								"embed",
								value.references[0].realLink,
								value.key.toLocaleUpperCase(),
								value.references[0]?.resolvedFile?.path ?? "",
								"snw-liveupdate",
								value.pos.start.line,
							);
							referenceElement.addClass("snw-embed-preview");
							element.after(referenceElement);
							break;
						}
					}
				});
			}

			if (plugin.settings.enableRenderingLinksInMarkdown && transformedCache?.links) {
				// biome-ignore lint/complexity/noForEach: <explanation>
				this.containerEl.querySelectorAll("a.internal-link").forEach((element) => {
					const dataHref = element.getAttribute("data-href");
					if (!dataHref) return;
					// Testing for normal links, links within same page starting with # and for ghost links
					const link =
						parseLinkTextToFullPath(
							dataHref[0] === "#" ? this.currentFile.path.slice(0, -(this.currentFile.extension.length + 1)) + dataHref : dataHref,
						) || dataHref;

					for (const value of transformedCache.links ?? []) {
						if (value.references.length >= minRefCountThreshold && value.key.toLocaleUpperCase() === link.toLocaleUpperCase()) {
							const referenceElement = htmlDecorationForReferencesElement(
								value.references.length,
								"link",
								value.references[0].realLink,
								value.key.toLocaleUpperCase(),
								value.references[0]?.resolvedFile?.path ?? "",
								"snw-liveupdate",
								value.pos.start.line,
							);
							referenceElement.addClass("snw-link-preview");
							element.after(referenceElement);
							break;
						}
					}
				});
			}

			if (plugin.settings.enableRenderingHeadersInMarkdown) {
				const headerKey = this.containerEl.querySelector("[data-heading]");
				if (transformedCache?.headings && headerKey) {
					const textContext = headerKey.getAttribute("data-heading");

					for (const value of transformedCache.headings) {
						if (value.references.length >= minRefCountThreshold && value.headerMatch === textContext?.replace(/\[|\]/g, "")) {
							const referenceElement = htmlDecorationForReferencesElement(
								value.references.length,
								"heading",
								value.references[0].realLink,
								value.key,
								value.references[0]?.resolvedFile?.path ?? "",
								"snw-liveupdate",
								value.pos.start.line,
							);
							referenceElement.addClass("snw-heading-preview");
							const headerElement = this.containerEl.querySelector("h1,h2,h3,h4,h5,h6");
							if (headerElement) {
								headerElement.insertAdjacentElement("beforeend", referenceElement);
							}
							break;
						}
					}
				}
			}
		}
	} // end of processMarkdown()
}
