import { LitRenameLocation } from "../../lit-analyzer/types/lit-rename-location";
import { translateRange } from "./translate-range";

export function translateRenameLocations(renameLocations: LitRenameLocation[]): ts.RenameLocation[] {
	return renameLocations.map(renameLocation => translateRenameLocation(renameLocation));
}

function translateRenameLocation({ fileName, prefixText, suffixText, range }: LitRenameLocation): ts.RenameLocation {
	const textSpan = translateRange(range);

	return {
		textSpan,
		fileName,
		prefixText,
		suffixText
	};
}
