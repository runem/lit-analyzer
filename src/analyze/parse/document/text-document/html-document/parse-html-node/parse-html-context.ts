import { Expression } from "typescript";
import { Range } from "../../../../../types/range";

export interface ParseHtmlContext {
	html: string;
	getPartsAtOffsetRange(range: Range): (string | Expression)[];
}
