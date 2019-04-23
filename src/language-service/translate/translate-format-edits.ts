import * as ts from "typescript";
import { LitFormatEdit } from "../../lit-analyzer/types/lit-format-edit";
import { translateRange } from "./translate-range";

export function translateFormatEdits(formatEdits: LitFormatEdit[]): ts.TextChange[] {
	return formatEdits.map(formatEdit => translateFormatEdit(formatEdit));
}

function translateFormatEdit(formatEdit: LitFormatEdit): ts.TextChange {
	return {
		newText: formatEdit.newText,
		span: translateRange(formatEdit.range)
	};
}
