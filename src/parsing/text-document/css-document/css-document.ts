import { VirtualDocument } from "../../virtual-document/virtual-document";
import { TextDocument } from "../text-document";

export class CssDocument extends TextDocument {
	constructor(virtualDocument: VirtualDocument) {
		super(virtualDocument);
	}
}
