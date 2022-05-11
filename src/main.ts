import {debounce, Plugin} from "obsidian";
import InlineReferenceExtension from "./inline-refs";
import {buildLinksAndReferences} from "./indexer";

export default class ThePlugin extends Plugin {
    appName = "Obsidian42 - Strange New Worlds";
    appID = "obsidian42-strange-new-worlds";

    async onload(): Promise < void > {
        console.log("loading " + this.appName);

        const indexDebounce = debounce( () =>{ buildLinksAndReferences(this.app) }, 3000, true );

        const initializeEnvironment = () => {
            
            this.registerEditorExtension([InlineReferenceExtension]); //enable the codemirror extensions
            
            this.registerEvent(
                this.app.metadataCache.on("resolve", (file) => {
                    indexDebounce();
                })
            );

            this.registerMarkdownPostProcessor((el, ctx) => {
                console.log("markdown post processor", el, ctx, ctx.getSectionInfo(el))
            });
        }

        // enable while developing
        initializeEnvironment();

        this.app.workspace.onLayoutReady(() => {
            const resolved = this.app.metadataCache.on("resolved", () => {
                this.app.metadataCache.offref(resolved);
                initializeEnvironment();
            });
        });
               
    }

    onunload(): void { console.log("unloading " + this.appName) }
}
