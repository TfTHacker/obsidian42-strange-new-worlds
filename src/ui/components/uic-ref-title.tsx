// Component to display the title at the top of a uic-ref-area

import SNWPlugin from 'src/main';
import { hideAll } from 'tippy.js';
import { IconMoreDetails } from '../IconMoreDetails';
import { render } from 'preact';
import { SortOrderDropdown } from '../SortOrderDropdown';

export const getUIC_Ref_Title_Div = (
  refType: string,
  realLink: string,
  key: string,
  filePath: string,
  refCount: number,
  lineNu: number,
  isPopover: boolean,
  plugin: SNWPlugin,
  handleSortOptionChangeCallback: () => void
): HTMLElement => {
  const titleElJsx = (
    <div className={`${isPopover ? 'snw-ref-title-popover' : 'snw-ref-title-side-pane'} tree-item-self is-clickable`}>
      <div
        className="snw-ref-title-popover-label"
        snw-ref-title-type={refType}
        snw-ref-title-reallink={realLink}
        snw-ref-title-key={key}
        snw-data-file-name={filePath}
        snw-data-line-number={lineNu.toString()}>
        {realLink}
      </div>
      <SortOrderDropdown plugin={plugin} onChange={handleSortOptionChangeCallback} />
      {isPopover && (
        <span
          className="snw-ref-title-popover-open-sidepane-icon"
          snw-ref-title-type={refType}
          snw-ref-title-reallink={realLink}
          snw-ref-title-key={key}
          snw-data-file-name={filePath}
          snw-data-line-number={lineNu.toString()}>
          <span
            className="snw-ref-title-popover-icon"
            onClick={(e: MouseEvent) => {
              e.stopPropagation();
              hideAll({ duration: 0 }); // hide popup
              plugin.activateView(refType, realLink, key, filePath, Number(lineNu));
            }}>
            <IconMoreDetails />
          </span>
        </span>
      )}
    </div>
  );

  const titleEl = createDiv();
  render(titleElJsx, titleEl);

  return titleEl;
};
