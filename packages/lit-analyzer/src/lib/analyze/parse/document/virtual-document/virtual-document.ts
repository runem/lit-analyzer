import { Expression } from "typescript";
import { DocumentOffset, DocumentRange, Range, SourceFilePosition, SourceFileRange } from "../../../types/range";

export interface VirtualDocument {
	fileName: string;
	location: SourceFileRange;
	text: string;
	getPartsAtDocumentRange(range?: DocumentRange): (Expression | string)[];
	sfPositionToDocumentOffset(position: SourceFilePosition): DocumentOffset;
	documentOffsetToSFPosition(offset: DocumentOffset): SourceFilePosition;
}

export function textPartsToRanges(parts: (Expression | string)[]): Range[] {
	let offset = 0;

	return parts
		.map(p => {
			if (typeof p === "string") {
				const startOffset = offset;
				offset += p.length;
				return {
					start: startOffset,
					end: offset
				} as Range;
			} else {
				offset += p.getText().length + 3;
			}
			return;
		})
		.filter((r): r is Range => r != null);
}
