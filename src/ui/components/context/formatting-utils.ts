import { HeadingCache, ListItemCache } from "obsidian";
import {
    getTextAtPosition,
    getTextFromLineStartToPositionEnd,
} from "./position-utils";

export const chainBreadcrumbs = (lines: string[]) =>
    lines
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join(" ➤ ");

export const formatListBreadcrumbs = (
    fileContents: string,
    breadcrumbs: ListItemCache[]
) =>
    chainBreadcrumbs(
        breadcrumbs
            .map((listCache) =>
                getTextAtPosition(fileContents, listCache.position)
            )
            .map((listText) => listText.trim().replace(/^-\s+/, ""))
    );

export const formatListWithDescendants = (
    textInput: string,
    listItems: ListItemCache[]
) => {
    const root = listItems[0];
    const leadingSpacesCount = root.position.start.col;
    return listItems
        .map((itemCache) =>
            getTextFromLineStartToPositionEnd(
                textInput,
                itemCache.position
            ).slice(leadingSpacesCount)
        )
        .join("\n");
};

export const formatHeadingBreadCrumbs = (breadcrumbs: HeadingCache[]) =>
    chainBreadcrumbs(breadcrumbs.map((headingCache) => headingCache.heading));
