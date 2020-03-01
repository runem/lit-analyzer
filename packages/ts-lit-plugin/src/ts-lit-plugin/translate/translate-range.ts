import { Range } from "lit-analyzer";
import { TextSpan } from "typescript";

export function translateRange(range: Range): TextSpan {
	return {
		start: range.start,
		length: range.end - range.start
	};
}
