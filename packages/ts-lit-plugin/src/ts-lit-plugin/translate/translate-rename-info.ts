import { LitRenameInfo } from "lit-analyzer";
import { RenameInfo } from "typescript";
import { translateTargetKind } from "./translate-target-kind";
import { translateRange } from "./translate-range";

export function translateRenameInfo({ displayName, fullDisplayName, kind, range }: LitRenameInfo): RenameInfo {
	const triggerSpan = translateRange(range);

	return {
		canRename: true,
		kind: translateTargetKind(kind),
		kindModifiers: "",
		displayName,
		fullDisplayName,
		triggerSpan
	};
}
