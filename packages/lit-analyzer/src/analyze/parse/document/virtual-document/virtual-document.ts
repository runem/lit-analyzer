import { Expression } from "typescript";
import { Range } from "../../../types/range";

export interface VirtualDocument {
	fileName: string;
	location: Range;
	text: string;
	getPartsAtOffsetRange(range?: Range): (Expression | string)[];
	scPositionToOffset(position: number): number;
	offsetToSCPosition(offset: number): number;
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
