import {gutter, GutterMarker, } from "@codemirror/view";
import { BlockInfo, EditorView } from "@codemirror/view";
import { editorInfoField } from "obsidian";
import { htmlDecorationForReferencesElement } from "src/view-extensions/htmlDecorations";
import { getSNWCacheByFile } from "src/indexer";
import ThePlugin from "src/main";

let thePlugin: ThePlugin;

export function setPluginVariableForCM6Gutter(plugin: ThePlugin) {
    thePlugin = plugin;
}

const referenceGutterMarker = class extends GutterMarker {
    referenceCount: number;
    referenceType: string;
    key: string;    //a unique identifer for the reference
    filePath: string;
    addCssClass: string; //if a reference need special treatment, this class can be assigned

    constructor(refCount: number, cssclass: string, key:string, filePath: string, addCSSClass: string){
        super();
        this.referenceCount = refCount;
        this.referenceType = cssclass;
        this.key = key;
        this.filePath = filePath;
        this.addCssClass = addCSSClass;
    }

    toDOM() {
        return htmlDecorationForReferencesElement(this.referenceCount, this.referenceType, this.key, this.filePath, this.addCssClass, 0);
    }
}

const emptyMarker = new class extends GutterMarker {
    toDOM() { return document.createTextNode("øøø") }
  }

const ReferenceGutterExtension = gutter({
    class: "snw-gutter-ref",
    lineMarker(editorView: EditorView, line: BlockInfo) {

        if(thePlugin.snwAPI.enableDebugging.GutterEmbedCounter) 
            thePlugin.snwAPI.console("ReferenceGutterExtension(EditorView, BlockInfo)", editorView, line )

        const mdView = editorView.state.field( editorInfoField );
        
        if(!mdView.file) return;
        const transformedCache = getSNWCacheByFile(mdView.file);

        // check if the page is to be ignored
        if(transformedCache?.cacheMetaData?.frontmatter?.["snw-file-exclude"]===true) return;

        const embedsFromMetaDataCache = mdView.app.metadataCache.getFileCache(mdView.file)?.embeds;

        if(embedsFromMetaDataCache?.length >= thePlugin.settings.minimumRefCountThreshold) {
            const lineNumberInFile = editorView.state.doc.lineAt(line.from).number;
            for (const embed of embedsFromMetaDataCache) {
                if(embed.position.start.line +1 === lineNumberInFile) {
                    for (const ref of transformedCache.embeds) {
                        if(ref?.references[0].excludedFile!=true && ref?.references.length>0 && ref?.pos.start.line+1 === lineNumberInFile) {
                            // @ts-ignore
                            let refOriginalLink = ref.references[0].reference.original;
                            if(refOriginalLink.substring(0,1)!="!") 
                                refOriginalLink = "!" + refOriginalLink;
                            if( editorView.state.doc.lineAt(line.from).text.trim() ===  refOriginalLink) {
                                if(thePlugin.snwAPI.enableDebugging.GutterEmbedCounter) 
                                    thePlugin.snwAPI.console("ReferenceGutterExtension New gutter", ref.references.length, "embed", ref.key, ref.key, "snw-embed-special" );
                                return new referenceGutterMarker(ref.references.length, "embed", ref.key, ref.references[0].resolvedFile.path.replace(".md",""), "snw-embed-special");
                            }
                        }
                    }
                }
            }
        }
    }, 
    initialSpacer: () => emptyMarker
})

export default ReferenceGutterExtension;
