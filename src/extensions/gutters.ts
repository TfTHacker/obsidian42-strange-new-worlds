import {gutter, GutterMarker} from "@codemirror/gutter";

const referenceGutterMarker = new class extends GutterMarker {
    toDOM() {
        return document.createTextNode("->")
    }
}

const ReferenceGutterExtension = gutter({
    class: "snw-gutter-ref",
    lineMarker(view, line) {
        try {
            const re = view.state.doc.lineAt(line.from).text;
            if (re.length > 0) 
                return referenceGutterMarker
             else 
                return null;
            
        } catch (error) {}
        return referenceGutterMarker;
    },
    domEventHandlers: {
        mousedown(view, line) {
            console.log('click', line)
            return true
        }
    }
})

export default ReferenceGutterExtension;
