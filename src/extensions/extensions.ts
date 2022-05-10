import {Plugin} from "obsidian";
import ReferenceGutterExtension from "./gutters"
import InlineReferenceExtension from "./inline-refs";

export function initializeCodeMirrorExtensions(plugin: Plugin) {
    plugin.registerEditorExtension([ 
        // ReferenceGutterExtension, 
        InlineReferenceExtension
    ]);
}