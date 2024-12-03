/**
 * Codemirror extension - hook into the CM editor
 * CM will call update as the doc updates.
 */
import { Decoration, type DecorationSet, type EditorView, MatchDecorator, ViewPlugin, type ViewUpdate, WidgetType } from "@codemirror/view";
import { editorInfoField, stripHeading } from "obsidian";
import { getSNWCacheByFile, parseLinkTextToFullPath } from "src/indexer";
import type SNWPlugin from "src/main";
import type { TransformedCachedItem } from "../types";
import { htmlDecorationForReferencesElement } from "./htmlDecorations";

let plugin: SNWPlugin;

export function setPluginVariableForCM6InlineReferences(snwPlugin: SNWPlugin) {
	plugin = snwPlugin;
}

/**
 * CM widget for renderinged matched ranges of references. This allows us to provide our UX for matches.
 */
export const InlineReferenceExtension = ViewPlugin.fromClass(
	class {
		decorator: MatchDecorator | undefined;
		decorations: DecorationSet = Decoration.none;
		regxPattern = "";

		constructor(public view: EditorView) {
			// The constructor seems to be called only once when a file is viewed. The decorator is called multipe times.
			if (plugin.settings.enableRenderingBlockIdInLivePreview) this.regxPattern = "(\\s\\^)(\\S+)$";
			if (plugin.settings.enableRenderingEmbedsInLivePreview) this.regxPattern += `${this.regxPattern !== "" ? "|" : ""}!\\[\\[(.*?)\\]\\]`;
			if (plugin.settings.enableRenderingLinksInLivePreview) this.regxPattern += `${this.regxPattern !== "" ? "|" : ""}\\[\\[(.*?)\\]\\]`;
			if (plugin.settings.enableRenderingHeadersInLivePreview) this.regxPattern += `${this.regxPattern !== "" ? "|" : ""}^#+\\s.+`;

			//if there is no regex pattern, then don't go further
			if (this.regxPattern === "") return;

			this.decorator = new MatchDecorator({
				regexp: new RegExp(this.regxPattern, "g"),
				decorate: (add, from, to, match, view) => {
					const mdView = view.state.field(editorInfoField);

					// there is no file, likely a canvas file, so stop processing
					if (!mdView.file) return;

					// Check if should show in source mode
					if (mdView.currentMode?.sourceMode === true && plugin.settings.displayInlineReferencesInSourceMode === false) return null;

					const mdViewFile = mdView.file;
					const transformedCache = getSNWCacheByFile(mdViewFile);

					if (
						(transformedCache.links || transformedCache.headings || transformedCache.embeds || transformedCache.blocks) &&
						transformedCache?.cacheMetaData?.frontmatter?.["snw-file-exclude"] !== true &&
						transformedCache?.cacheMetaData?.frontmatter?.["snw-canvas-exclude-edit"] !== true
					) {
						const firstCharacterMatch = match[0].charAt(0);
						const widgetsToAdd: {
							key: string;
							transformedCachedItem: TransformedCachedItem[] | null;
							refType: string;
							from: number;
							to: number;
						}[] = [];

						if (firstCharacterMatch === "[" && (transformedCache?.links?.length ?? 0) > 0) {
							let newLink = match[0].replace("[[", "").replace("]]", "");
							//link to an internal page link, add page name
							if (newLink.startsWith("#")) newLink = mdViewFile.path + newLink;
							newLink = newLink.toLocaleUpperCase();
							widgetsToAdd.push({
								key: newLink,
								transformedCachedItem: transformedCache.links ?? null,
								refType: "link",
								from: to,
								to: to,
							});
						} else if (firstCharacterMatch === "#" && ((transformedCache?.headings?.length || transformedCache?.links?.length) ?? 0) > 0) {
							//heading
							widgetsToAdd.push({
								// @ts-ignore
								key: stripHeading(match[0].replace(/^#+/, "").substring(1)),
								transformedCachedItem: transformedCache.headings ?? null,
								refType: "heading",
								from: to,
								to: to,
							});
							if (plugin.settings.enableRenderingLinksInLivePreview) {
								// this was not working with mobile from 0.16.4 so had to convert it to a string
								const linksinHeader = match[0].match(/\[\[(.*?)\]\]|!\[\[(.*?)\]\]/g);
								if (linksinHeader)
									for (const l of linksinHeader) {
										widgetsToAdd.push({
											key: l.replace("![[", "").replace("[[", "").replace("]]", "").toLocaleUpperCase(), //change this to match the references cache
											transformedCachedItem: l.startsWith("!") ? (transformedCache.embeds ?? null) : (transformedCache.links ?? null),
											refType: "link",
											from: to - match[0].length + (match[0].indexOf(l) + l.length),
											to: to - match[0].length + (match[0].indexOf(l) + l.length),
										});
									}
							}
						} else if (firstCharacterMatch === "!" && (transformedCache?.embeds?.length ?? 0) > 0) {
							//embeds
							let newEmbed = match[0].replace("![[", "").replace("]]", "");
							//link to an internal page link, add page name
							if (newEmbed.startsWith("#")) newEmbed = mdViewFile.path + stripHeading(newEmbed);
							widgetsToAdd.push({
								key: newEmbed.toLocaleUpperCase(),
								transformedCachedItem: transformedCache.embeds ?? null,
								refType: "embed",
								from: to,
								to: to,
							});
						} else if (firstCharacterMatch === " " && (transformedCache?.blocks?.length ?? 0) > 0) {
							widgetsToAdd.push({
								//blocks
								key: (mdViewFile.path + match[0].replace(" ^", "#^")).toLocaleUpperCase(), //change this to match the references cache
								transformedCachedItem: transformedCache.blocks ?? null,
								refType: "block",
								from: to,
								to: to,
							});
						}

						// first see if it is a heading, as it should be sorted to the end, then sort by position
						const sortWidgets = widgetsToAdd.sort((a, b) => (a.to === b.to ? (a.refType === "heading" ? 1 : -1) : a.to - b.to));

						for (const ref of widgetsToAdd) {
							if (ref.key !== "") {
								const wdgt = constructWidgetForInlineReference(
									ref.refType,
									ref.key,
									ref.transformedCachedItem ?? [],
									mdViewFile.path,
									mdViewFile.extension,
								);
								if (wdgt != null) {
									add(ref.from, ref.to, Decoration.widget({ widget: wdgt, side: 1 }));
								}
							}
						} // end for
					}
				},
			});

			this.decorations = this.decorator.createDeco(view);
		}

		update(update: ViewUpdate) {
			if (this.regxPattern !== "" && (update.docChanged || update.viewportChanged)) {
				this.decorations = this.decorator ? this.decorator.updateDeco(update, this.decorations) : this.decorations;
				// this.decorations = this.decorator?.updateDeco(update, this.decorations);
			}
		}
	},
	{
		decorations: (v) => v.decorations,
	},
);

// Helper function for preparing the Widget for displaying the reference count
const constructWidgetForInlineReference = (
	refType: string,
	key: string,
	references: TransformedCachedItem[],
	filePath: string,
	fileExtension: string,
): InlineReferenceWidget | null => {
	let modifyKey = key;
	for (let i = 0; i < references.length; i++) {
		const ref = references[i];
		let matchKey = ref.key;
		if (refType === "heading") {
			matchKey = stripHeading(ref.headerMatch ?? ""); // headers require special comparison
			modifyKey = modifyKey.replace(/^\s+|\s+$/g, ""); // should be not leading spaces
		}

		if (refType === "embed" || refType === "link") {
			// check for aliased references
			if (modifyKey.contains("|")) modifyKey = modifyKey.substring(0, key.search(/\|/));
			const parsedKey = parseLinkTextToFullPath(modifyKey).toLocaleUpperCase();
			modifyKey = parsedKey === "" ? modifyKey : parsedKey; //if no results, likely a ghost link
			if (matchKey.startsWith("#")) {
				// internal page link
				matchKey = filePath + stripHeading(matchKey);
			}
		}

		if (matchKey === modifyKey) {
			const filePath = ref?.references[0]?.resolvedFile
				? ref.references[0].resolvedFile.path.replace(`.${ref.references[0].resolvedFile}`, "")
				: modifyKey;
			if (ref?.references.length >= plugin.settings.minimumRefCountThreshold)
				return new InlineReferenceWidget(
					ref.references.length,
					ref.type,
					ref.references[0].realLink,
					ref.key,
					filePath,
					"snw-liveupdate",
					ref.pos.start.line,
				);
			return null;
		}
	}
	return null;
};

// CM widget for renderinged matched ranges of references. This allows us to provide our UX for matches.
export class InlineReferenceWidget extends WidgetType {
	referenceCount: number;
	referenceType: string;
	realLink: string;
	key: string; //a unique identifier for the reference
	filePath: string;
	addCssClass: string; //if a reference need special treatment, this class can be assigned
	lineNu: number; //number of line within the file

	constructor(refCount: number, cssclass: string, realLink: string, key: string, filePath: string, addCSSClass: string, lineNu: number) {
		super();
		this.referenceCount = refCount;
		this.referenceType = cssclass;
		this.realLink = realLink;
		this.key = key;
		this.filePath = filePath;
		this.addCssClass = addCSSClass;
		this.lineNu = lineNu;
	}

	// eq(other: InlineReferenceWidget) {
	//     return other.referenceCount == this.referenceCount;
	// }

	toDOM() {
		return htmlDecorationForReferencesElement(
			this.referenceCount,
			this.referenceType,
			this.realLink,
			this.key,
			this.filePath,
			this.addCssClass,
			this.lineNu,
		);
	}

	destroy() {}

	ignoreEvent() {
		return false;
	}
}
