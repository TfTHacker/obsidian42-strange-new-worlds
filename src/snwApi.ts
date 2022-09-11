import { getCurrentPage } from "./indexer";
import ThePlugin from "./main";

/**
 * Provide a simple API for use with Templater, Dataview and debugging the complexities of various pages.
 * main.ts will attach this to window.snwAPI
 *
 * @export
 * @class SnwAPI
 */
export default class SnwAPI {
    plugin: ThePlugin;

    constructor(plugin: ThePlugin) {
        this.plugin = plugin    
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console = (logDescription: string, ...outputs: any[]): void => {
        if(this.plugin.settings.debugMode===true)
            console.log("SNW: " + logDescription, outputs)
    }

    /**
     * For active file return the meta information used by various components of SNW
     *
     * @return {*}  {Promise<any>} // Needs to be any since we might return just about anything
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getMetaInfoByCurrentFile = async (): Promise<any> => {
        return this.getMetaInfoByFileName(app.workspace.getActiveFile().path)
    }

    /**
     * For given file name passed into the function, get the meta info for that file
     *
     * @param {string} fileName (or file name path)
     * @memberof SnwAPI
     */
    getMetaInfoByFileName = async (fileName: string)=> {
        const currentFile = app.metadataCache.getFirstLinkpathDest(fileName, "/")
        return {
            TFile: currentFile,
            metadataCache: app.metadataCache.getFileCache(currentFile),
            SnwTransformedCache: getCurrentPage(currentFile, this.plugin.app),
        } 
    }
}
