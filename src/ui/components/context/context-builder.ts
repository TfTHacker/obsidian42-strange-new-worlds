import { CachedMetadata, HeadingCache, ListItemCache, Pos, SectionCache } from 'obsidian';
import { doesPositionIncludeAnother } from './position-utils';

export class ContextBuilder {
  private readonly listItems: ListItemCache[];
  private readonly headings: HeadingCache[];
  private readonly sections: SectionCache[];

  constructor(
    private readonly fileContents: string,
    { listItems = [], headings = [], sections = [] }: CachedMetadata
  ) {
    this.listItems = listItems;
    this.headings = headings;
    this.sections = sections;
  }

  getListItemIndexContaining = (searchedForPosition: Pos) => {
    return this.listItems.findIndex(({ position }) =>
      doesPositionIncludeAnother(position, searchedForPosition)
    );
  };

  getSectionContaining = (searchedForPosition: Pos) => {
    return this.sections.find(({ position }) =>
      doesPositionIncludeAnother(position, searchedForPosition)
    );
  };

  getListItemWithDescendants = (listItemIndex: number) => {
    const rootListItem = this.listItems[listItemIndex];
    const listItemWithDescendants = [rootListItem];

    for (let i = listItemIndex + 1; i < this.listItems.length; i++) {
      const nextItem = this.listItems[i];
      if (nextItem.parent < rootListItem.position.start.line) {
        return listItemWithDescendants;
      }
      listItemWithDescendants.push(nextItem);
    }

    return listItemWithDescendants;
  };

  getListBreadcrumbs(position: Pos) {
    const listBreadcrumbs: ListItemCache[] = [];

    if (this.listItems.length === 0) {
      return listBreadcrumbs;
    }

    const thisItemIndex = this.getListItemIndexContaining(position);
    const isPositionOutsideListItem = thisItemIndex < 0;

    if (isPositionOutsideListItem) {
      return listBreadcrumbs;
    }

    const thisItem = this.listItems[thisItemIndex];
    let currentParent = thisItem.parent;

    if (this.isTopLevelListItem(thisItem)) {
      return listBreadcrumbs;
    }

    for (let i = thisItemIndex - 1; i >= 0; i--) {
      const currentItem = this.listItems[i];

      const currentItemIsHigherUp = currentItem.parent < currentParent;
      if (currentItemIsHigherUp) {
        listBreadcrumbs.unshift(currentItem);
        currentParent = currentItem.parent;
      }

      if (this.isTopLevelListItem(currentItem)) {
        return listBreadcrumbs;
      }
    }

    return listBreadcrumbs;
  }

  getFirstSectionUnder(position: Pos) {
    return this.sections.find(
      (section) => section.position.start.line > position.start.line
    );
  }

  getHeadingContaining(position: Pos) {
    const index = this.getHeadingIndexContaining(position);
    return this.headings[index];
  }

  getHeadingBreadcrumbs(position: Pos) {
    const headingBreadcrumbs: HeadingCache[] = [];
    if (this.headings.length === 0) {
      return headingBreadcrumbs;
    }

    const collectAncestorHeadingsForHeadingAtIndex = (startIndex: number) => {
      let currentLevel = this.headings[startIndex].level;
      const previousHeadingIndex = startIndex - 1;

      for (let i = previousHeadingIndex; i >= 0; i--) {
        const lookingAtHeading = this.headings[i];

        if (lookingAtHeading.level < currentLevel) {
          currentLevel = lookingAtHeading.level;
          headingBreadcrumbs.unshift(lookingAtHeading);
        }
      }
    };

    const headingIndexAtPosition = this.getHeadingIndexContaining(position);
    const positionIsInsideHeading = headingIndexAtPosition >= 0;

    if (positionIsInsideHeading) {
      collectAncestorHeadingsForHeadingAtIndex(headingIndexAtPosition);
      return headingBreadcrumbs;
    }

    const headingIndexAbovePosition = this.getIndexOfHeadingAbove(position);
    const positionIsBelowHeading = headingIndexAbovePosition >= 0;

    if (positionIsBelowHeading) {
      const headingAbovePosition = this.headings[headingIndexAbovePosition];
      headingBreadcrumbs.unshift(headingAbovePosition);
      collectAncestorHeadingsForHeadingAtIndex(headingIndexAbovePosition);
      return headingBreadcrumbs;
    }

    return headingBreadcrumbs;
  }

  private isTopLevelListItem(listItem: ListItemCache) {
    return listItem.parent <= 0;
  }

  private getIndexOfHeadingAbove(position: Pos) {
    if (position === undefined) return -1; //added because of properties - need to fix later
    return this.headings.reduce(
      (previousIndex, lookingAtHeading, index) =>
        lookingAtHeading.position.start.line < position.start.line ?
          index
        : previousIndex,
      -1
    );
  }

  private getHeadingIndexContaining(position: Pos) {
    if (position === undefined) return -1; //added because of properties - need to fix later
    return this.headings.findIndex(
      (heading) => heading.position.start.line === position.start.line
    );
  }
}
