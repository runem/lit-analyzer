import { CompletionEntry, CompletionInfo } from "typescript";
import { LitCompletion } from "../../lit-analyzer/types/lit-completion";
import { translateTargetKind } from "./translate-target-kind";
import { translateRange } from "./translate-range";

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
}

function translateCompletion(completion: LitCompletion): CompletionEntry {
	const { importance, kind, insert, name, range } = completion;

	return {
		name,
		kind: translateTargetKind(kind),
		kindModifiers: completion.kindModifiers,
		sortText: importance === "high" ? "0" : importance === "medium" ? "1" : "2",
		insertText: insert,
		...(range != null ? { replacementSpan: translateRange(range) } : {})
	};
}
