import { Pos } from "obsidian";

export const getTextAtPosition = (textInput: string, pos: Pos) =>
    textInput.substring(pos.start.offset, pos.end.offset);

export const getTextFromLineStartToPositionEnd = (
    textInput: string,
    pos: Pos
) => textInput.substring(pos.start.offset - pos.start.col, pos.end.offset);

export const doesPositionIncludeAnother = (container: Pos, child: Pos) =>{
    try { //added because of properties - need to fix later
        return container.start.offset <= child.start.offset &&
        container.end.offset >= child.end.offset;        
    } catch (error) {
        return false
    }
}