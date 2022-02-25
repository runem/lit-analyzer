import { VirtualAstCssDocument } from "../../virtual-document/virtual-css-document.js";
import { TextDocument } from "../text-document.js";

export class CssDocument extends TextDocument {
	constructor(virtualDocument: VirtualAstCssDocument) {
		super(virtualDocument);
	}
}
