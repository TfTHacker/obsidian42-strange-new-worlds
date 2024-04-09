import { getIndexedReferences, getSNWCacheByFile } from './indexer';
import SNWPlugin from './main';

/**
 * Provide a simple API for use with Templater, Dataview and debugging the complexities of various pages.
 * main.ts will attach this to window.snwAPI
 */
export default class SnwAPI {
  plugin: SNWPlugin;

  constructor(snwPlugin: SNWPlugin) {
    this.plugin = snwPlugin;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console = (logDescription: string, ...outputs: any[]): void => {
    console.log('SNW: ' + logDescription, outputs);
  };

  // For active file return the meta information used by various components of SNW
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMetaInfoByCurrentFile = async (): Promise<any> => {
    return this.getMetaInfoByFileName(app.workspace.getActiveFile()?.path || '');
  };

  searchReferencesStartingWith = async (searchString: string) => {
    for (const [key, value] of getIndexedReferences()) {
      if (key.startsWith(searchString)) {
        console.log(key, value);
      }
    }
  };

  // For given file name passed into the function, get the meta info for that file
  getMetaInfoByFileName = async (fileName: string) => {
    const currentFile = app.metadataCache.getFirstLinkpathDest(fileName, '/');
    return {
      TFile: currentFile,
      metadataCache: currentFile ? app.metadataCache.getFileCache(currentFile) : null,
      SnwTransformedCache: currentFile ? getSNWCacheByFile(currentFile) : null
    };
  };
}
