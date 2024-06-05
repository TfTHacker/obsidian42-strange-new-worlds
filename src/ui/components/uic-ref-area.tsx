//wrapper element for references area. shared between popover and sidepane

import { setIcon } from 'obsidian';
import { getIndexedReferences } from 'src/indexer';
import SNWPlugin from 'src/main';
import { Link } from 'src/types';
import { SortOption } from '../../settings';
import { getUIC_Ref_Item } from './uic-ref-item';
import { getUIC_Ref_Title_Div } from './uic-ref-title';
import { setFileLinkHandlers } from './uic-ref--parent';
import { render } from 'preact';

let plugin: SNWPlugin;

export function setPluginVariableUIC_RefArea(snwPlugin: SNWPlugin) {
  plugin = snwPlugin;
}

//Creates the primarhy "AREA" body for displaying refrences. This is the overall wrapper for the title and individaul references
export const getUIC_Ref_Area = async (
  refType: string,
  realLink: string,
  key: string,
  filePath: string,
  lineNu: number,
  isHoverView: boolean
): Promise<HTMLElement> => {
  const refAreaItems = await getRefAreaItems(refType, key, filePath);
  const refAreaContainerEl = createDiv();

  //get title header for this reference area
  refAreaContainerEl.append(
    getUIC_Ref_Title_Div(refType, realLink, key, filePath, refAreaItems.refCount, lineNu, isHoverView, plugin, async () => {
      // Callback to re-render the references area when the sort option is changed
      const refAreaEl: HTMLElement | null = refAreaContainerEl.querySelector('.snw-ref-area');
      if (refAreaEl) {
        refAreaEl.style.visibility = 'hidden';
        while (refAreaEl.firstChild) {
          refAreaEl.removeChild(refAreaEl.firstChild);
        }
        refAreaEl.style.visibility = 'visible';
        const refAreaItems = await getRefAreaItems(refType, key, filePath);
        refAreaEl.prepend(refAreaItems.response);

        setTimeout(async () => {
          await setFileLinkHandlers(false, refAreaEl);
        }, 500);
      }
    })
  );

  const refAreaEl = createDiv({ cls: 'snw-ref-area' });
  refAreaEl.append(refAreaItems.response);
  refAreaContainerEl.append(refAreaEl);

  return refAreaContainerEl;
};

const sortLinks = (links: Link[], option: SortOption): Link[] => {
  return links.sort((a, b) => {
    const fileA = a.sourceFile;
    const fileB = b.sourceFile;
    switch (option) {
      case 'name-asc':
        return fileA!.basename.localeCompare(fileB!.basename);
      case 'name-desc':
        return fileB!.basename.localeCompare(fileA!.basename);
      case 'mtime-asc':
        return fileA!.stat.mtime - fileB!.stat.mtime;
      case 'mtime-desc':
        return fileB!.stat.mtime - fileA!.stat.mtime;
      default:
        return 0;
    }
  });
};

// Creates a DIV for a collection of reference blocks to be displayed
const getRefAreaItems = async (refType: string, key: string, filePath: string): Promise<{ response: HTMLElement; refCount: number }> => {
  let countOfRefs = 0;
  let linksToLoop: Link[] = null;

  if (refType === 'File') {
    const allLinks: Link[] = getIndexedReferences();
    const incomingLinks = [];
    for (const items of allLinks.values()) {
      for (const item of items) {
        if (item?.resolvedFile && item?.resolvedFile?.path === filePath) incomingLinks.push(item);
      }
    }

    countOfRefs = incomingLinks.length;
    linksToLoop = incomingLinks;
  } else {
    let refCache: Link[] = getIndexedReferences().get(key);
    if (refCache === undefined) refCache = getIndexedReferences().get(key);
    const sortedCache = await sortRefCache(refCache);
    countOfRefs = sortedCache.length;
    linksToLoop = sortedCache;
  }

  // get the unique file names for files in thie refeernces
  const uniqueFileKeys: Link[] = Array.from(new Set(linksToLoop.map((a: Link) => a.sourceFile?.path))).map((file_path) => {
    return linksToLoop.find((a) => a.sourceFile?.path === file_path);
  });

  const sortedFileKeys = sortLinks(uniqueFileKeys, plugin.settings.sortOptionDefault);

  const wrapperEl = createDiv();

  let maxItemsToShow = plugin.settings.maxFileCountToDisplay;

  if (countOfRefs < maxItemsToShow) {
    maxItemsToShow = countOfRefs;
  }

  let itemsDisplayedCounter = 0;

  let customProperties = null;
  if (plugin.settings.displayCustomPropertyList.trim() != '')
    customProperties = plugin.settings.displayCustomPropertyList.split(',').map((x) => x.trim());

  for (let index = 0; index < sortedFileKeys.length; index++) {
    if (itemsDisplayedCounter > maxItemsToShow) continue;
    const file_path = sortedFileKeys[index];
    const responseItemContainerEl = createDiv();
    responseItemContainerEl.addClass('snw-ref-item-container');
    responseItemContainerEl.addClass('tree-item');

    wrapperEl.appendChild(responseItemContainerEl);

    const refItemFileEl = createDiv();
    refItemFileEl.addClass('snw-ref-item-file');
    refItemFileEl.addClass('tree-item-self');
    refItemFileEl.addClass('search-result-file-title');
    refItemFileEl.addClass('is-clickable');
    refItemFileEl.setAttribute('snw-data-line-number', '-1');
    refItemFileEl.setAttribute('snw-data-file-name', file_path.sourceFile.path.replace('.' + file_path.sourceFile?.extension, ''));
    refItemFileEl.setAttribute('data-href', file_path.sourceFile.path);
    refItemFileEl.setAttribute('href', file_path.sourceFile.path);

    const refItemFileIconEl = createDiv();
    refItemFileIconEl.addClass('snw-ref-item-file-icon');
    refItemFileIconEl.addClass('tree-item-icon');
    refItemFileIconEl.addClass('collapse-icon');
    setIcon(refItemFileIconEl, 'file-box');

    const refItemFileLabelEl = createDiv();
    refItemFileLabelEl.addClass('snw-ref-item-file-label');
    refItemFileLabelEl.addClass('tree-item-inner');
    refItemFileLabelEl.innerText = file_path.sourceFile.basename;

    refItemFileEl.append(refItemFileIconEl);
    refItemFileEl.append(refItemFileLabelEl);

    responseItemContainerEl.appendChild(refItemFileEl);

    // Add custom property field to display
    if (customProperties != null) {
      const fileCache = plugin.app.metadataCache.getFileCache(file_path.sourceFile);
      customProperties.forEach((propName) => {
        const propValue = fileCache?.frontmatter?.[propName];
        if (propValue) {
          const customPropertyElement = (
            <div class="snw-custom-property-container">
              <span class="snw-custom-property-name">{propName}</span>
              <span class="snw-custom-property-text">: {propValue}</span>
            </div>
          );
          const fieldEl = createDiv();
          render(customPropertyElement, fieldEl);
          refItemFileLabelEl.append(fieldEl);
        }
      });
    }

    const refItemsCollectionE = createDiv();
    refItemsCollectionE.addClass('snw-ref-item-collection-items');
    refItemsCollectionE.addClass('search-result-file-matches');
    responseItemContainerEl.appendChild(refItemsCollectionE);

    for (const ref of linksToLoop) {
      if (file_path.sourceFile.path === ref.sourceFile.path && itemsDisplayedCounter < maxItemsToShow) {
        itemsDisplayedCounter += 1;
        refItemsCollectionE.appendChild(await getUIC_Ref_Item(ref));
      }
    }
  }

  return { response: wrapperEl, refCount: countOfRefs };
};

const sortRefCache = async (refCache: Link[]): Promise<Link[]> => {
  return refCache.sort((a, b) => {
    let positionA = 0; //added because of properties - need to fix later
    if (a.reference.position !== undefined) positionA = Number(a.reference.position.start.line);

    let positionB = 0; //added because of properties - need to fix later
    if (b.reference.position !== undefined) positionB = Number(b.reference.position.start.line);

    return a.sourceFile.basename.localeCompare(b.sourceFile.basename) || Number(positionA) - Number(positionB);
  });
};
