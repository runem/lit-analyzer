import { LitRenameLocation } from "lit-analyzer";
import { translateRange } from "./translate-range.js";
import { RenameLocation } from "typescript";

export function translateRenameLocations(renameLocations: LitRenameLocation[]): RenameLocation[] {
	return renameLocations.map(renameLocation => translateRenameLocation(renameLocation));
}

function translateRenameLocation({ fileName, prefixText, suffixText, range }: LitRenameLocation): RenameLocation {
	const textSpan = translateRange(range);

	return {
		textSpan,
		fileName,
		prefixText,
		suffixText
	};
}
