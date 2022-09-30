SNW is a wild plugin. Seems sinple on the surface, but its a royal pain in the butt. So this document might help any nerds trying to make the sense of the code.

# In the beginning ...
Obsidian loads main.ts. Then some important things are registered.

Keep in mind that the Live preview editor is using Codemirror, and we need special code to handle Codemirror. Reading mode, or Preview mode is its own Obsidian thing, so we need code to handle that. What this means is we need two process both the Codemirror editor in its own way, and reading mode in its own way. Net result is two different processors to do the same thing.
- Codemirror specific files:
  - references-cm6.ts is the main processor for Codemirror. It uses Codemirros Regex parser to identify references. This is very effecient model.
    - gutters.ts is also related to Codemirror. Due to the way Obsidian renders embedded references (for example ![[page#heading]]), the block ref count wont show in the editor as it does with other reference counts. For this reason, we show the count in the gutter to give the user a hint their is a block reference.
- Reading mode
  - reference-preview.ts - uses the Markdown rendering feature of the Obsidian API to embed reference counts. This processor uses the Obsidian Cache to dientify references. Sadly this means we use two different strategies depending on if its Codemirror editor or Live preview

# Shared code
- Both CM and Reading mode use the htmlDecorations.ts file to generate the block reference count. 
- components folder - contains the elements for building the hover view popup or sidepane. Each file handles a specific part.
  - uic-ref--parent - is the main container and starting point for either Hover view or sidepane rendering
    - uic-ref-title.ts - displays the title at the top of the hover view or sidepane
    - uic-ref-area.ts - the display of references
      - uic-ref-item.ts - the individual reference item rendering

