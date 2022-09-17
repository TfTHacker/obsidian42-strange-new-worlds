import {gutter, GutterMarker, } from "@codemirror/view";
import { BlockInfo, EditorView } from "@codemirror/view";
import { editorInfoField } from "obsidian";
import { htmlDecorationForReferencesElement } from "src/htmlDecorations";
import { getCurrentPage } from "src/indexer";
import {generateArialLabel} from "./references-preview";

const referenceGutterMarker = class extends GutterMarker {
    referenceCount: number;
    referenceType: string;
    key: string;    //a unique identifer for the reference
    link: string;
    arialLabel: string;
    addCssClass: string; //if a reference need special treatment, this class can be assigned

    constructor(refCount: number, cssclass: string, key:string, link: string, arialLabel: string, addCSSClass: string){
        super();
        this.referenceCount = refCount;
        this.referenceType = cssclass;
        this.key = key;
        this.link = link;
        this.arialLabel = arialLabel;
        this.addCssClass = addCSSClass;
    }

    toDOM() {
        return htmlDecorationForReferencesElement(this.referenceCount, this.referenceType, this.key, this.link, this.arialLabel, this.addCssClass);
    }
}

const emptyMarker = new class extends GutterMarker {
    toDOM() { return document.createTextNode("øøø") }
  }

const ReferenceGutterExtension = gutter({
    class: "snw-gutter-ref",
    lineMarker(editorView: EditorView, line: BlockInfo) {

        const mdView = editorView.state.field( editorInfoField );
        
        if(!mdView.file) return;

        const embedsFromMetaDataCache = mdView.app.metadataCache.getFileCache(mdView.file)?.embeds;

        if(embedsFromMetaDataCache?.length>0) {
            const lineNumberInFile = editorView.state.doc.lineAt(line.from).number;
            for (const embed of embedsFromMetaDataCache) {
                if(embed.position.start.line +1 === lineNumberInFile) {
                    const transformedCache = getCurrentPage(mdView.file, mdView.app);
                    for (const ref of transformedCache.embeds) {
                        if(ref?.references.length>1 && ref?.pos.start.line+1 === lineNumberInFile) {
                            // @ts-ignore
                            if( editorView.state.doc.lineAt(line.from).text.trim() ===  ref.references[0].reference.original ) {
                                const arialLabel = generateArialLabel(mdView.file.path, ref);
                                return new referenceGutterMarker(ref.references.length, "embed", ref.key, ref.key, arialLabel, "snw-embed-special");
                            }
                        }
                    }
                }
            }
        }
    },
    initialSpacer: () => emptyMarker,
    domEventHandlers: {
        click(view, line, event) {
            console.log('click')
            return true;
            }
    }
})

export default ReferenceGutterExtension;
