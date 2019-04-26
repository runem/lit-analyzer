import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { HtmlDocument } from "../../../parse/document/text-document/html-document/html-document";
import { isHTMLNode } from "../../../types/html-node/html-node-types";
import { LitRenameLocation } from "../../../types/lit-rename-location";
import { renameLocationsForTagName } from "./rename-locations-for-tag-name";

export function renameLocationsAtOffset(document: HtmlDocument, offset: number, request: LitAnalyzerRequest): LitRenameLocation[] {
	const hit = document.htmlNodeOrAttrAtOffset(offset);
	if (hit == null) return [];

	if (isHTMLNode(hit)) {
		return renameLocationsForTagName(hit.tagName, request);
	}

	return [];
}
