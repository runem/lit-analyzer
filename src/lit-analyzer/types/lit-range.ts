import { TextDocument } from "../parse/document/text-document/text-document";

export interface SourceFileRange {
	start: number;
	end: number;
}

export interface DocumentRange {
	start: number;
	end: number;
	document?: TextDocument;
}
