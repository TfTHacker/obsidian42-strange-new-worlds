import tippy from "tippy.js";
import type SNWPlugin from "../main";
import { UPDATE_DEBOUNCE } from "../main";
import "tippy.js/dist/tippy.css";
import { Platform, debounce } from "obsidian";
import { render } from "preact";
import { getUIC_Hoverview } from "src/ui/components/uic-ref--parent";

let plugin: SNWPlugin;

export function setPluginVariableForHtmlDecorations(snwPlugin: SNWPlugin) {
	plugin = snwPlugin;
}

/**
 * Shared function between references-cm6.ts and references-preview.
 * This decoration is just the html box drawn into the document with the count of references.
 * It is used in the header as well as inline in the document. If a user clicks on this element,
 * the function processHtmlDecorationReferenceEvent is called
 *
 * @export
 * @param {number} count            Number to show in the box
 * @param {string} referenceType    The type of references (block, embed, link, header)
 * @param {string} realLink         The real link to the reference contained in the document
 * @param {string} key              Unique key used to identify this reference based on its type
 * @param {string} filePath         File path in file in vault
 * @param {string} attachCSSClass   if special class is need for the element
 * @return {*}  {HTMLElement}
 */
export function htmlDecorationForReferencesElement(
	count: number,
	referenceType: string,
	realLink: string,
	key: string,
	filePath: string,
	attachCSSClass: string,
	lineNu: number,
): HTMLElement {
	const referenceElementJsx = (
		<div
			className={`snw-reference snw-${referenceType} ${attachCSSClass}`}
			data-snw-type={referenceType}
			data-snw-reallink={realLink}
			data-snw-key={key}
			data-snw-filepath={filePath}
			snw-data-line-number={lineNu.toString()}
		>
			{count.toString()}
		</div>
	);

	const refenceElement = createDiv();
	render(referenceElementJsx, refenceElement);
	const refCountBox = refenceElement.firstElementChild as HTMLElement;

	if (Platform.isDesktop || Platform.isDesktopApp)
		//click is default to desktop, otherwise mobile behaves differently
		refCountBox.onclick = async (e: MouseEvent) =>
			processHtmlDecorationReferenceEvent(e.target as HTMLElement);

	const requireModifierKey =
		plugin.settings.requireModifierKeyToActivateSNWView;
	// defaults to showing tippy on hover, but if requireModifierKey is true, then only show on ctrl/meta key
	let showTippy = true;
	const tippyObject = tippy(refCountBox, {
		interactive: true,
		appendTo: () => document.body,
		allowHTML: true,
		zIndex: 9999,
		placement: "auto-end",
		// trigger: "click", // on click is another option instead of hovering at all
		onTrigger(instance, event) {
			const mouseEvent = event as MouseEvent;
			if (requireModifierKey === false) return;
			if (mouseEvent.ctrlKey || mouseEvent.metaKey) {
				showTippy = true;
			} else {
				showTippy = false;
			}
		},
		onShow(instance) {
			// returning false will cancel the show (coming from onTrigger)
			if (!showTippy) return false;

			setTimeout(async () => {
				await getUIC_Hoverview(instance);
			}, 1);
		},
	});

	tippyObject.popper.classList.add("snw-tippy");

	return refenceElement;
}

//  Opens the sidebar SNW pane by calling activateView on main.ts
export const processHtmlDecorationReferenceEvent = async (
	target: HTMLElement,
) => {
	const refType = target.getAttribute("data-snw-type") ?? "";
	const realLink = target.getAttribute("data-snw-realLink") ?? "";
	const key = target.getAttribute("data-snw-key") ?? "";
	const filePath = target.getAttribute("data-snw-filepath") ?? "";
	const lineNu = target.getAttribute("snw-data-line-number") ?? "";
	plugin.activateView(refType, realLink, key, filePath, Number(lineNu));
};

// loops all visble references marked with the class snw-liveupdate and updates the count if needed
// or removes the element if the reference is no longer in the document
export const updateAllSnwLiveUpdateReferencesDebounce = debounce(
	() => {
		// biome-ignore lint/complexity/noForEach: <explanation>
		document.querySelectorAll(".snw-liveupdate").forEach((element) => {
			const currentCount = Number((element as HTMLElement).innerText);
			const key = element.getAttribute("data-snw-key");
			if (plugin.snwAPI.references.has(key)) {
				const newCount = plugin.snwAPI.references.get(key).length;
				if (
					newCount === 0 ||
					newCount < plugin.settings.minimumRefCountThreshold
				) {
					element.remove();
				} else if (newCount !== currentCount) {
					(element as HTMLElement).innerText = newCount.toString();
				}
			} else {
				// count is now 0, remove the element
				element.remove();
			}
		});
	},
	UPDATE_DEBOUNCE,
	true,
);
