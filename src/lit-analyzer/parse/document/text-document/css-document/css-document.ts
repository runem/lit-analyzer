import { VirtualAstCssDocument } from "../../virtual-document/virtual-css-document";
import { TextDocument } from "../text-document";

export class CssDocument extends TextDocument {
	constructor(virtualDocument: VirtualAstCssDocument) {
		super(virtualDocument);
	}
}
