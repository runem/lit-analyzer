import { TaggedTemplateExpression } from "typescript";
import { TextDocument } from "../text-document/text-document";

export class CSSDocument {
	constructor(public textDocument: TextDocument, public astNode: TaggedTemplateExpression) {}
}
