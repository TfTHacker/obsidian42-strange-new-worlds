// the title displayed at the top of a uic-ref-area

import SNWPlugin from 'src/main';
import { hideAll } from 'tippy.js';
import { setIcon } from 'obsidian';

/**
 * Title in HoverView or sidepane
 *
 * @param {string} key
 * @param {string} filePath
 * @param {number} refCount
 * @param {boolean} isPopover
 * @return {*}  {Promise<string>}
 */
export const getUIC_Ref_Title_Div = async (
  refType: string,
  realLink: string,
  key: string,
  filePath: string,
  refCount: number,
  lineNu: number,
  isPopover: boolean,
  thePlugin: SNWPlugin
): Promise<HTMLElement> => {
  const titleEl = createDiv();
  titleEl.addClass(isPopover ? 'snw-ref-title-popover' : 'snw-ref-title-side-pane');
  titleEl.addClass('tree-item-self');
  titleEl.addClass('is-clickable');
  titleEl.setAttribute('snw-ref-title-type', refType);
  titleEl.setAttribute('snw-ref-title-reallink', realLink);
  titleEl.setAttribute('snw-ref-title-key', key);
  titleEl.setAttribute('snw-data-file-name', filePath);
  titleEl.setAttribute('snw-data-line-number', lineNu.toString());

  const titleLabelEl = createDiv({ cls: 'snw-ref-title-popover-label' });
  titleLabelEl.innerText = realLink;

  titleEl.append(titleLabelEl);

  if (isPopover) {
    const openSidepaneIconEl = createSpan();
    openSidepaneIconEl.addClass('snw-ref-title-popover-icon');
    setIcon(openSidepaneIconEl, 'more-horizontal');

    const imgWrappper = createSpan();
    imgWrappper.appendChild(openSidepaneIconEl);
    imgWrappper.addClass('snw-ref-title-popover-open-sidepane-icon');
    imgWrappper.setAttribute('snw-ref-title-type', refType);
    imgWrappper.setAttribute('snw-ref-title-reallink', realLink);
    imgWrappper.setAttribute('snw-ref-title-key', key);
    imgWrappper.setAttribute('snw-data-file-name', filePath);
    imgWrappper.setAttribute('snw-data-line-number', lineNu.toString());
    titleEl.appendChild(imgWrappper);

    //event bindings
    setTimeout(async () => {
      if (imgWrappper) {
        imgWrappper.onclick = async (e: MouseEvent) => {
          e.stopPropagation();
          hideAll({ duration: 0 }); // hide popup
          // @ts-ignore
          const parentEl = e.target.closest('.snw-ref-title-popover-open-sidepane-icon');
          //open view into side pane
          const refType = parentEl.getAttribute('snw-ref-title-type');
          const realLink = parentEl.getAttribute('snw-ref-title-reallink');
          const key = parentEl.getAttribute('snw-ref-title-key');
          const path = parentEl.getAttribute('snw-data-file-name');
          const lineNu = parentEl.getAttribute('snw-data-line-number');
          thePlugin.activateView(refType, realLink, key, path, Number(lineNu));
        };
      }
    }, 300);
  } //END isPopover

  return titleEl;
};
