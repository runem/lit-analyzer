import { Node, SourceFile } from "typescript";
import { TextDocument } from "../parse/document/text-document/text-document";
import { Range } from "./range";

export interface SourceFileRange extends Range {
	file: SourceFile;
}

export interface DocumentRange extends Range {
	document: TextDocument;
}

export interface NodeRange extends Range {
	node: Node;
}

export type LitRange = SourceFileRange | DocumentRange | NodeRange;
