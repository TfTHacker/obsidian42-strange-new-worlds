import { CachedMetadata, debounce, Plugin, TFile} from "obsidian";
import { initializeCodeMirrorExtensions } from "./extensions/extensions";
import { buildLinksAndReferences, getCurrentPage } from "./indexer";

export default class ThePlugin extends Plugin {
    appName = "Obsidian42 - Strange New Worlds";
    appID = "obsidian42-strange-new-worlds";

    async onload(): Promise < void > {
        console.clear();
        console.log("loading " + this.appName);
        initializeCodeMirrorExtensions(this);

        const indexDebounce = debounce(
            () => {
                buildLinksAndReferences(this.app);
            },
            3000,
            true
        );
        // this.registerEvent(
        //     this.app.vault.on("delete", () => {
        //         indexDebounce();
        //     })
        // );

        // this.registerEvent(
        //     this.app.workspace.on("layout-change", () => {
        //         console.log("event layout-change");
        //     })
        // );

        // this.registerEvent(
        //     this.app.workspace.on("file-open", (file): void => {
        //         console.log("event file-open");
        //     })
        // );

        // this.registerEvent(
        //     this.app.metadataCache.on("resolve", (file) => {
        //         console.log("event resolve");
        //     })
        // );

        this.registerEvent(
            this.app.metadataCache.on("resolved", ()=> {
                // console.log("event changed ", file, cache);
                indexDebounce();
                // setTimeout(() => {
                //     console.log("getCurrentPage", getCurrentPage({ file, app: this.app }));
                // }, 1000);
            })
        );
               
        // this.registerEvent(
        //     this.app.workspace.on("editor-change", (file) => {
        //         console.log("event editor-change  ");
        //     })
        // );
               
        
    }

    onunload(): void { console.log("unloading " + this.appName) }
}
