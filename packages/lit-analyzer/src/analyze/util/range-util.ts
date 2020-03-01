import { Node } from "typescript";
import { TextDocument } from "../parse/document/text-document/text-document";
import { HtmlNodeAttr } from "../types/html-node/html-node-attr-types";
import { HtmlNode } from "../types/html-node/html-node-types";
import { DocumentRange, Range, SourceFileRange } from "../types/range";

export function makeSourceFileRange(range: Range): SourceFileRange {
	return range as SourceFileRange;
}

export function makeDocumentRange(range: Range): DocumentRange {
	return range as DocumentRange;
}

export function rangeFromHtmlNodeAttr(htmlAttr: HtmlNodeAttr): SourceFileRange {
	return documentRangeToSFRange(htmlAttr.document, htmlAttr.location.name);
	//return { document: htmlAttr.document, ...htmlAttr.location.name };
}

export function rangeFromHtmlNode(htmlNode: HtmlNode): SourceFileRange {
	return documentRangeToSFRange(htmlNode.document, htmlNode.location.name);
	//return { document: htmlNode.document, ...htmlNode.location.name };
}

export function rangeFromNode(node: Node): SourceFileRange {
	//return { file: node.getSourceFile(), start: node.getStart(), end: node.getEnd() };
	return makeSourceFileRange({ start: node.getStart(), end: node.getEnd() });
}

export function documentRangeToSFRange(document: TextDocument, range: DocumentRange | Range): SourceFileRange {
	return makeSourceFileRange({
		start: document.virtualDocument.documentOffsetToSFPosition(range.start),
		end: document.virtualDocument.documentOffsetToSFPosition(range.end)
	});
}

export function sfRangeToDocumentRange(document: TextDocument, range: SourceFileRange | Range): DocumentRange {
	return makeDocumentRange({
		start: document.virtualDocument.sfPositionToDocumentOffset(range.start),
		end: document.virtualDocument.sfPositionToDocumentOffset(range.end)
	});
}

/**
 * Returns if a position is within start and end.
 * @param position
 * @param start
 * @param end
 */
//export function intersects(position: SourceFilePosition | SourceFileRange, { start, end }: SourceFileRange): boolean;
//export function intersects(position: DocumentOffset | DocumentRange, { start, end }: DocumentRange): boolean;
export function intersects(position: number | Range, { start, end }: Range): boolean {
	if (typeof position === "number") {
		return start <= position && position <= end;
	} else {
		return start <= position.start && position.end <= end;
	}
}
