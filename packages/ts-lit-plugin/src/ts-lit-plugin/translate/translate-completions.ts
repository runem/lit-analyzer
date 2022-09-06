import { LitCompletion } from "lit-analyzer";
import { CompletionEntry, CompletionInfo } from "typescript";
import { translateRange } from "./translate-range.js";
import { translateTargetKind } from "./translate-target-kind.js";

export function translateCompletions(completions: LitCompletion[]): CompletionInfo | undefined {
	const entries = completions.map(completion => translateCompletion(completion));

	if (entries != null && entries.length > 0) {
		return {
			isGlobalCompletion: false,
			isMemberCompletion: false,
			isNewIdentifierLocation: false,
			entries
		};
	}

	return undefined;
}

function translateCompletion(completion: LitCompletion): CompletionEntry {
	const { importance, kind, insert, name, range } = completion;

	return {
		name,
		kind: translateTargetKind(kind),
		kindModifiers: completion.kindModifiers,
		sortText: completion.sortText != null ? completion.sortText : importance === "high" ? "0" : importance === "medium" ? "1" : "2",
		insertText: insert,
		...(range != null ? { replacementSpan: translateRange(range) } : {})
	};
}
