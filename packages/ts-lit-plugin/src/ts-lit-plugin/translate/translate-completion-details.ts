import { LitCompletionDetails } from "lit-analyzer";
import { CompletionEntryDetails } from "typescript";
import { LitPluginContext } from "../lit-plugin-context";

export function translateCompletionDetails(completionDetails: LitCompletionDetails, context: LitPluginContext): CompletionEntryDetails {
	return {
		name: completionDetails.name,
		kind: context.ts.ScriptElementKind.label,
		kindModifiers: "",
		displayParts: [
			{
				text: completionDetails.primaryInfo,
				kind: "text"
			}
		],
		documentation:
			completionDetails.secondaryInfo == null
				? []
				: [
						{
							kind: "text",
							text: completionDetails.secondaryInfo
						}
				  ]
	};
}
