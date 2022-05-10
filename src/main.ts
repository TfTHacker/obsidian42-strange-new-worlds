import {debounce, Plugin} from "obsidian";
import {initializeCodeMirrorExtensions } from "./extensions/extensions";
import {buildLinksAndReferences} from "./indexer";

export default class ThePlugin extends Plugin {
    appName = "Obsidian42 - Strange New Worlds";
    appID = "obsidian42-strange-new-worlds";

    async onload(): Promise < void > {
        console.log("loading " + this.appName);

        const indexDebounce = debounce( () =>{ buildLinksAndReferences(this.app) }, 3000, true );

        const initializeEnvironment = () => {
               
                this.registerEvent(
                    this.app.vault.on("delete", () => {
                        indexDebounce(); 
                    })
                );

                this.registerEvent(
                    this.app.workspace.on("layout-change", () => {
                        // indexDebounce();
                        // previewDebounce();
                    })
                );

                // this.registerEvent(
                //     this.app.workspace.on("file-open", (file): void => {
                //         indexDebounce();
                //         // this.page = getCurrentPage({ file, app: this.app });
                //         // previewDebounce();
                //     })
                // );

                this.registerEvent(
                    this.app.metadataCache.on("resolve", (file) => {
                        indexDebounce();
                        // this.page = getCurrentPage({ file, app: this.app });
                        // previewDebounce();
                    })
                );

                initializeCodeMirrorExtensions(this); //enable the codemirror extensions
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
