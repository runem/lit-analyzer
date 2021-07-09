import { Expression } from "typescript";
import { Range } from "../../../../../types/range";
import { HtmlDocument } from "../html-document";

export interface ParseHtmlContext {
	html: string;
	document: HtmlDocument;
	getPartsAtOffsetRange(range: Range): (string | Expression)[];
}
