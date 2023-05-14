# 1.2.0 (2023-05-13)

## New
+ Breadcrumbs: Add context around links inside the previews of SNW. Many thanks for PR by @@ivan-lednev (https://github.com/TfTHacker/obsidian42-strange-new-worlds/pull/90)
+ Respect Obsidian's global excluded files. Many thanks for PR by @sk91 (https://github.com/TfTHacker/obsidian42-strange-new-worlds/pull/88)
+ Ghost links now supported: This is a link to a file that doesnt exist in the vault. A counter now appears to such "ghosted" links. (https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/67)

## Updates
+ All core libraries updated to Obsidian 1.3.0
+ BIG CHANGE: The internal link engine has been fine tuned to not be case-sensitive, but this required massive changes to the way links are resolved. Hopefully this will improve the accuracy of SNW reference counters. This should resolve iseue (https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/75)(https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/34)(https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/64)

## Bug Fixes
+ Fix to styling conflict with better-fn (https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/93)
+ Fix to block reference counters not formatting properly when in lists (https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/89)
+ Fix to Header reference does not render when header includes a colon (https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/94)
+ Fix Indicators don't appear correctly on tasks as well (https://github.com/TfTHacker/obsidian42-strange-new-worlds/issues/39)

