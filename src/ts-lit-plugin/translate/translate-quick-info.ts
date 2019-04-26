import { QuickInfo } from "typescript";
import { LitQuickInfo } from "../../lit-analyzer/types/lit-quick-info";
import { tsModule } from "../../ts-module";
import { translateRange } from "./translate-range";

export function translateQuickInfo(quickInfo: LitQuickInfo): QuickInfo {
	return {
		kind: tsModule.ts.ScriptElementKind.label,
		kindModifiers: "",
		textSpan: translateRange(quickInfo.range),
		displayParts: [
			{
				text: quickInfo.primaryInfo,
				kind: "text"
			}
		],
		documentation:
			quickInfo.secondaryInfo == null
				? []
				: [
						{
							kind: "text",
							text: quickInfo.secondaryInfo
						}
				  ]
	};
}
