import { TextSpan } from "typescript";
import { LitRange } from "../../../../lit-analyzer/src/analyze/types/lit-range";

export function translateRange(range: LitRange): TextSpan {
	if ("document" in range) {
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
