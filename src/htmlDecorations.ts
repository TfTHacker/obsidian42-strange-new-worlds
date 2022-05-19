import { MarkdownView } from "obsidian";
import ThePlugin from "./main";
import { Link } from "./types";

const processReferenceEvent = async (event: MouseEvent, plugin: ThePlugin) => {
    event.preventDefault();
    const key = event.target.getAttribute("data-snw-key");
    const refType = event.target.getAttribute("data-snw-type");
    const link = event.target.getAttribute("data-snw-link")


    plugin.activateView(key, refType, link);

    // app.workspace.trigger("hover-link", {
    //     event: event,
    //     source: 'source',
    //     hoverParent: document.querySelector(".markdown-preview-view"),
    //     targetEl: null,
    //     linktext: 'test',
    // });

}

export function htmlReferenceElement(thePlugin: ThePlugin, count: number, referenceType: string, key: string, link: string): HTMLElement {
    const element = document.createElement("span")
    element.className = "snw-reference snw-" + referenceType;
    element.innerText= " " + count.toString() + " ";
    element.setAttribute("data-snw-key", key);
    element.setAttribute("data-snw-type", referenceType);
    element.setAttribute("data-snw-link", link);
    

    element.onclick = (e: any ) => processReferenceEvent(e, thePlugin);
    
    // element.onmouseover = async (e: any ) => processReferenceEvent(e, thePlugin); 

    return element;
}

export function setHeaderWithReferenceCounts(thePlugin: ThePlugin, incomingLinks: Link[], mdView: MarkdownView) {
    const headerTitleDiv: HTMLDivElement = mdView.containerEl.querySelector(".view-actions");
    const fileList = (incomingLinks.map(link => link.sourceFile.path.replace(".md",""))).join("\n")

    console.log('setHederWithReferenceCounts', incomingLinks)
    
    if(incomingLinks.length===0) {
        if(mdView.containerEl.querySelector(".snw-header-count"))
            mdView.containerEl.querySelector(".snw-header-count").remove();   
        return
    }


    if (headerTitleDiv) {
        let snwTitleRefCountDisplayCountEl: HTMLElement = mdView.containerEl.querySelector(".snw-header-count");
        if (!snwTitleRefCountDisplayCountEl) {
            const wrapper: HTMLElement = document.createElement("a");
            wrapper.className = "view-action";
            wrapper.className = "snw-header-count-wrapper";
            snwTitleRefCountDisplayCountEl = document.createElement("div");
            snwTitleRefCountDisplayCountEl.className = "snw-header-count";            
            wrapper.appendChild(snwTitleRefCountDisplayCountEl);
            // wrapper.insertAfter(headerTitleDiv);
            headerTitleDiv.prepend(snwTitleRefCountDisplayCountEl)
        }
        console.log("start")
        snwTitleRefCountDisplayCountEl.innerText = " " + incomingLinks.length.toString() + " ";
        snwTitleRefCountDisplayCountEl.setAttribute("data-snw-key",  mdView.file.basename);
        snwTitleRefCountDisplayCountEl.setAttribute("data-snw-type", "File");
        snwTitleRefCountDisplayCountEl.setAttribute("data-snw-link", mdView.file.path);
        snwTitleRefCountDisplayCountEl.ariaLabel = "Strange New Worlds\n" + fileList;
        snwTitleRefCountDisplayCountEl.onclick = (e: any ) => processReferenceEvent(e, thePlugin);
    } 
}



    
    // element.addClass("internal-link")
    // element.setAttr("data-href", "MALISEK Kasija")

    
    // const h = document.createElement("div");
        
        
        
    // const view:MarkdownView = app.workspace.getActiveViewOfType(MarkdownView);
    // console.log(view)
    // window.xyz = view
    
    // const mv = new MarkdownView(view.leaf);
    
    // console.log("mv",mv)
    
    // const wrapper = document.createElement('div');
    // mv.contentEl.appendChild(wrapper)
    // h.appendChild(mv.contentEl);
    // const x = new HoverPopover(this, e.srcElement);
    // x.hoverEl.append(h);
    
    // console.log(h)
    
    // // new Notice(`<a data-href="zTESTING/main" href="link file 1" class="internal-link snw-link-preview" target="_blank" rel="noopener">link file 1</a>`, 10000)
    // h.innerHTML =`<div class="markdown-preview-view markdown-rendered"><a data-href="zTESTING/main" href="zTESTING/main" class="internal-link snw-link-preview" target="_blank" rel="noopener">Unttiled</a></div>`;
    // wrapper.style.display = 'hidden';
    // document.body.appendChild(wrapper);
    // await MarkdownRenderer.renderMarkdown("this is my document [[main]] and text", wrapper, , null);
    // const x:HTMLElement = document.createElement("div");


    // x.innerHTML= `<a data-href="main" href="main" class="internal-link snw-link-preview" target="_blank" rel="noopener">Unttiled</a>`
    // x.style.fontSize="20pt"
    // console.log(e)
    // e.srcElement.appendChild(x)
        // app.workspace.trigger("hover-link", {
        //     event: e,
        //     source: "preview",
        //     hoverParent: e.target,
        //     targetEl: null, //hoverPreviewTarget,
        //     linktext: "test2",
        //     sourcePath: "test2",
        //   });

        // }


    //     app.workspace.trigger("hover-link", {
    //         event: e,
    //         source: 'source',
    //         hoverParent: document.querySelector(".markdown-preview-view"),
    //         targetEl: null,
    //         linktext: 'zTESTING/main.md',
    //     });
    //     // sourcePath: 'zTESTING/main.md', 
    // }
