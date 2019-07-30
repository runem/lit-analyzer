import { DocumentRange } from "lit-analyzer";
import { TextSpan } from "typescript";

export function translateRange(range: DocumentRange): TextSpan {
	if (range.document != null) {
		return {
			start: range.document.virtualDocument.offsetToSCPosition(range.start),
			length: range.end - range.start
		};
	}

	return {
		start: range.start,
		length: range.end - range.start
	};
}
