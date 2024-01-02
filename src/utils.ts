// pulled from here: https://github.com/slindberg/jquery-scrollparent/blob/master/jquery.scrollparent.js
const getScrollParent = (element: HTMLElement, includeHidden: boolean): HTMLElement => {
  let style = getComputedStyle(element);
  const excludeStaticParent = style.position === 'absolute';
  const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;

  if (style.position === 'fixed') return document.body;
  for (let parent: HTMLElement | null = element; (parent = parent.parentElement); ) {
    style = getComputedStyle(parent);
    if (excludeStaticParent && style.position === 'static') {
      continue;
    }
    if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX))
      return parent;
  }

  return document.body;
};

const scrollResultsIntoView = (resultContainerEl: HTMLElement): void => {
  const searchResults = resultContainerEl.querySelectorAll(
    '.search-result-file-matched-text'
  );
  for (const searchResult of Array.from(searchResults)) {
    if (searchResult instanceof HTMLElement) {
      const scrollParent = getScrollParent(searchResult, true) as HTMLElement;
      if (scrollParent) {
        scrollParent.scrollTop =
          searchResult.offsetTop - scrollParent.offsetTop - scrollParent.offsetHeight / 2;
      }
    }
  }
};

export { getScrollParent, scrollResultsIntoView };
