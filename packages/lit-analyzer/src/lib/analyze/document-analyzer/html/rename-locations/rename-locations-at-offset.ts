import { LitAnalyzerContext } from "../../../lit-analyzer-context";
import { HtmlDocument } from "../../../parse/document/text-document/html-document/html-document";
import { isHTMLNode } from "../../../types/html-node/html-node-types";
import { LitRenameLocation } from "../../../types/lit-rename-location";
import { DocumentOffset } from "../../../types/range";
import { renameLocationsForTagName } from "./rename-locations-for-tag-name";

export function renameLocationsAtOffset(document: HtmlDocument, offset: DocumentOffset, context: LitAnalyzerContext): LitRenameLocation[] {
	const hit = document.htmlNodeOrAttrAtOffset(offset);
	if (hit == null) return [];

	if (isHTMLNode(hit)) {
		return renameLocationsForTagName(hit.tagName, context);
	}

	return [];
}
