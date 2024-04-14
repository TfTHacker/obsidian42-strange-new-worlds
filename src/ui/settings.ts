export interface Settings {
  enableOnStartupDesktop: boolean;
  enableOnStartupMobile: boolean;
  minimumRefCountThreshold: number; //minimum required to display a count
  maxFileCountToDisplay: number; // maximum number of items to display in popup or sidepane
  displayIncomingFilesheader: boolean;
  displayInlineReferencesLivePreview: boolean;
  displayInlineReferencesMarkdown: boolean;
  displayEmbedReferencesInGutter: boolean;
  displayEmbedReferencesInGutterMobile: boolean;
  displayPropertyReferences: boolean;
  displayPropertyReferencesMobile: boolean;
  enableRenderingBlockIdInMarkdown: boolean;
  enableRenderingLinksInMarkdown: boolean;
  enableRenderingHeadersInMarkdown: boolean;
  enableRenderingEmbedsInMarkdown: boolean;
  enableRenderingBlockIdInLivePreview: boolean;
  enableRenderingLinksInLivePreview: boolean;
  enableRenderingHeadersInLivePreview: boolean;
  enableRenderingEmbedsInLivePreview: boolean;
  enableIgnoreObsExcludeFoldersLinksFrom: boolean; //Use Obsidians Exclude Files from folder - links from those files outgoing to other files
  enableIgnoreObsExcludeFoldersLinksTo: boolean; //Use Obsidians Exclude Files from folder - links to those "excluded" files
  requireModifierKeyToActivateSNWView: boolean; //require CTRL hover to activate SNW view
}

export const DEFAULT_SETTINGS: Settings = {
  enableOnStartupDesktop: true,
  enableOnStartupMobile: true,
  minimumRefCountThreshold: 2,
  maxFileCountToDisplay: 100,
  displayIncomingFilesheader: true,
  displayInlineReferencesLivePreview: true,
  displayInlineReferencesMarkdown: true,
  displayEmbedReferencesInGutter: false,
  displayEmbedReferencesInGutterMobile: false,
  displayPropertyReferences: true,
  displayPropertyReferencesMobile: false,
  enableRenderingBlockIdInMarkdown: true,
  enableRenderingLinksInMarkdown: true,
  enableRenderingHeadersInMarkdown: true,
  enableRenderingEmbedsInMarkdown: true,
  enableRenderingBlockIdInLivePreview: true,
  enableRenderingLinksInLivePreview: true,
  enableRenderingHeadersInLivePreview: true,
  enableRenderingEmbedsInLivePreview: true,
  enableIgnoreObsExcludeFoldersLinksFrom: false,
  enableIgnoreObsExcludeFoldersLinksTo: false,
  requireModifierKeyToActivateSNWView: false
};
