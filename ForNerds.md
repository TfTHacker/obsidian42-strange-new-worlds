SNw is a wild plugin. Seems sinple on surface, but its a royal pain in the butt. So this document might help any nerds trying to make the sense of the code.

# In the beginning ...
Obsidian loads main.ts. Then some important things are registered.

Keep in mind that the Live preview editor is using Codemirror, and we need code to handle code mirror. Preview is its own Obsidian thing, so we need code to handle that. They basically do the same thing but for two different "views" - CM and Preview.

# CodeMirror Extension

- registerEditorExtension - Registers a CodeMirror 6 extension, for SNW this is in references-cm6.ts 
  - InlineReferenceExtension - Extends CM ViewPlugin interface - this gives us a hook into the CM6 editor
    - calclulateInlineReferences - This extension receives calls from CM when text needs to be analyzed. This function returns a collection of ranges, where each range contains info about where the reference counter should be displayed.
       - A lot of crucial work is done in this function to tell CM6 waht to do
    - InlineReferenceWidget - when a range is rendered by CM, it creates this widget for the UX elements (calclulateInlineReferences will create an instance of InlineReferenceWidget for every matching range)
      - The widget uses the shared function htmlDecorationForReferencesElement() to create the html displayed in the UI. This same function is also used for the Preview renderer. So both CM editor and preview mode use the same rendering html.

# Preview Renderer
- registerMarkdownPostProcessor


# Cache of document references
- registerEvent(this.app.metadataCache.on("resolve", (file) => indexDebounce()));



# CSS Structure
## Popovers
- Parent container for popovers for reference counts
  - snw-popover-container
- Parent container for sidepane
  - snw-sp-container
- Reference area (this is shared components used by popover and sidepane)
  - snw-ref-area is container for references, including title at top and all refernce info thereafter
