import { MarkdownView, Platform, type WorkspaceLeaf, debounce } from "obsidian";
import { getSNWCacheByFile } from "src/indexer";
import { htmlDecorationForReferencesElement } from "src/view-extensions/htmlDecorations";
import type SNWPlugin from "../main";
import { UPDATE_DEBOUNCE } from "../main";
import type { TransformedCachedItem } from "../types";

let plugin: SNWPlugin;

export function setPluginVariableForFrontmatterLinksRefCount(snwPlugin: SNWPlugin) {
	plugin = snwPlugin;
}

// Iterates all open documents to see if they are markdown file, and if so called processHeader
function setFrontmatterLinksReferenceCounts() {
	plugin.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
		if (leaf.view instanceof MarkdownView) processFrontmatterLinks(leaf.view as MarkdownView);
	});
}

export const updatePropertiesDebounce = debounce(
	() => {
		setFrontmatterLinksReferenceCounts();
	},
	UPDATE_DEBOUNCE,
	true,
);

function processFrontmatterLinks(mdView: MarkdownView) {
	if (plugin.showCountsActive === false) return;
	const state =
		Platform.isMobile || Platform.isMobileApp ? plugin.settings.displayPropertyReferencesMobile : plugin.settings.displayPropertyReferences;
	if (state === false) return;

	if (mdView?.rawFrontmatter === "") return;
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const transformedCache = getSNWCacheByFile(mdView.file!);
	// if no frontmatter links, exit
	if (transformedCache.frontmatterLinks?.length === 0) return;

	// biome-ignore lint/complexity/noForEach: <explanation>
	mdView.metadataEditor.rendered.forEach((item) => {
		const innerLink = item.valueEl.querySelector(".metadata-link-inner.internal-link");
		if (innerLink) {
			const fmMatch = transformedCache.frontmatterLinks?.find((item) => item.displayText === innerLink.innerText);
			if (fmMatch) appendRefCounter(innerLink, fmMatch);
		} else {
			const pillLinks = item.valueEl.querySelectorAll(".multi-select-pill.internal-link .multi-select-pill-content span");
			if (pillLinks.length > 0) {
				// biome-ignore lint/complexity/noForEach: <explanation>
				pillLinks.forEach((pill: HTMLElement) => {
					if (pill) {
						const fmMatch = transformedCache.frontmatterLinks?.find((item) => item.displayText === pill.innerText);
						// biome-ignore lint/style/noNonNullAssertion: <explanation>
						if (fmMatch) appendRefCounter(pill.parentElement!, fmMatch);
					}
				});
			}
		}
	});
}

function appendRefCounter(parentLink: HTMLElement, cacheItem: TransformedCachedItem) {
	let wrapperEl = parentLink.parentElement?.querySelector(".snw-frontmatter-wrapper");

	const refCount = cacheItem.references.length;

	if (!wrapperEl && refCount >= plugin.settings.minimumRefCountThreshold) {
		wrapperEl = createSpan({ cls: "snw-frontmatter-wrapper" });
		const htmlCounter = htmlDecorationForReferencesElement(
			refCount,
			"link",
			cacheItem.references[0].realLink,
			cacheItem.key,
			cacheItem.references[0]?.resolvedFile?.path.replace(`.${cacheItem.references[0]?.resolvedFile?.extension}`, ""),
			"snw-frontmatter-count",
			cacheItem.pos.start.line,
		);
		wrapperEl.appendChild(htmlCounter);
		parentLink.insertAdjacentElement("afterend", wrapperEl);
	} else {
		try {
			//update the existing wrapper with current count, otherwise if the count fell below the threshold, remove it
			if (refCount >= plugin.settings.minimumRefCountThreshold) {
				const countElement = wrapperEl?.querySelector(".snw-frontmatter-count") as HTMLElement | null;
				if (countElement) {
					countElement.innerText = ` ${refCount} `;
				}
			} else {
				wrapperEl?.remove();
			}
		} catch (error) {
			//no node to change, ignore this error
		}
	}
}
