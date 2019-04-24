import { RenameInfo } from "typescript";
import { LitRenameInfo } from "../../lit-analyzer/types/lit-rename-info";
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
