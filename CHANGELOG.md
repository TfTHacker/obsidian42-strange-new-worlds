# # 2.3.1
- Change: if a link is the only link in the vault to a destination (thus the reference count is 1), the reference counter will not be shown next to the link, regardless of the minimum threshold count set in settings. This makes sense. If the link is used once, its obvious without the counter, and the counter simply stating the link has one reference was redudant and annoying to many users.

# 2.3.0 
- New: Added support for references to show up in the kanban plugin. This can be toggled on and off in settings.
- Changed: SNW's internal index did not include file extensions, which in some cases led to issues. the index now uses the full path with the extension, which means every file whether it is a MD file or not is included in the index.

# 2.2.1

- Reference count now appears in the files property subpan

# 2.2.0 

- This is another major update to the indexing engine to avoid detecting certain reported issues.
- Additional optimization efforts to improve performance. (removing loops, keeping index optimized)
- Fix: when a link or embed points to the file it is in, it will now be included in the reference count.
- One challenge is case-sensitivity. In fact, Obsidian allows links to be case-insensitive, but the internal link engine is case-sensitive. This is a problem when a link is written in a different case than the file name. This update should help with this issue. The internal index ignores the case of links. [#145](https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/145), [#153](https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/153), [[#142](https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/142)]
- Partial fix to  [[#154](https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/154)]
- Fix: Cannot distinguish the title with the same name [#143](https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/143)
- Fixed issue with Alias links display reference counts
- Fiex: issue with [#139](https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/139) disabling incoming headers settings


# 2.1.5

- Updating plugin to newest Obsidian recommendations https://docs.obsidian.md/oo24/plugin.
- Transition to Biome from EsLint and Prettier.
- Update to new DeferredView handling - Thank you to @baodrate for PR [151](https://github.com/TfTHacker/obsidian42-strange-new-worlds/pull/151)

# 2.1.4

- New: In Settings under Custom Display List, the display of references can be customized to show properties from referenced files. In Settings, provide a comma separated list of case-sensitive property names. If a file has any of these properties when displayed in the reference list, the properties will also be displayed.

# 2.1.3

- Fix: after sorting list of references, they would not respond to being clicked on.
- Dependency updates

# 2.1.2

- New: Added an option to toggle SNW off and on in Source Mode. By default, it is toggled off, since source mode is intended to view the raw markdown. This can be changed in the settings. [#137](https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/137)

# 2.1.1

- Fix to sidepane not opening after being closed [#136](https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/136)

# 2.1.0

## New

- Items shown in the refreence panel can now be sorted by File Name and Date Modified, in ascending and decending order. This can be changed in the reference count hover panel or sidepane. A change in either these places will be reflected in the other.

# 2.0.3

## New

- Added indexing properties as part of the link counting

# Updated

- Major rewrite of the internal indexer - significant performance improvements
- Removed the caching tuning feature - this wasn't proving to be of help in performance
- Simplified the Settings screen where possible

# Fixed

- Fixed max items that can be displayed when reviewing references
- Block reference counts will not show up in Export to PDF
- Improved the handling of ghost files (files that don't exist in the vault, but are linked to)

# 1.2.6 (2024-04-05)

- Dependency updates
- Added Github action to automate the release process

# 1.2.4 (2023-11-??)

Thanks to the help of @GitMurf, SNW has made some nice steps forward

- New toggle to control if a modifier key is needed to hover an SNW counter when hovering over it. This can be turned off/on in settings.
- Performance optimizations focused on preventing delays while typing in a document
- Typescriptifying the codebase where it wasn't Typescripty

# 1.2.3 (2023-11-04)

- Update of dependencies and new version of esbuild
- small bug fixes from when properties was added (though this doesn't really make SNW work with properties properly yet)

# 1.2.0 (2023-05-13)

## New

- Breadcrumbs: Add context around links inside the previews of SNW. Many thanks for PR by @@ivan-lednev (https://github.com/TfTHacker/obsidian42-strange-new-worlds/pull/90)
- Respect Obsidian's global excluded files. Many thanks for PR by @sk91 (https://github.com/TfTHacker/obsidian42-strange-new-worlds/pull/88)
- Ghost links now supported: This is a link to a file that doesnt exist in the vault. A counter now appears to such "ghosted" links. (https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/67)(https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/26)
- Added two new frontmatter properties to control if SNW counters are shown in canvas: `snw-canvas-exclude-preview: true` and `snw-canvas-exclude-edit: true`

## Updates

- All core libraries updated to Obsidian 1.3.0
- BIG CHANGE: The internal link engine has been fine tuned to not be case-sensitive, but this required massive changes to the way links are resolved. Hopefully this will improve the accuracy of SNW reference counters. This should resolve iseue (https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/75)(https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/34)(https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/64)

## Bug Fixes

- Fix to styling conflict with better-fn (https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/93)
- Fix to block reference counters not formatting properly when in lists (https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/89)
- Fix to Header reference does not render when header includes a colon (https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/94)
- Fix Indicators don't appear correctly on tasks as well (https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/39)
- Links or embeds pointing to their own page will now be included in reference counts. (https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/60) (https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/77)
- Fix so that SNW doesnt run in the kanban plugin
