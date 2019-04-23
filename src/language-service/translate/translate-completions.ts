import { CompletionEntry, CompletionInfo, ScriptElementKind } from "typescript";
import { LitCompletion, LitCompletionKind } from "../../lit-analyzer/types/lit-completion";
import { tsModule } from "../../ts-module";
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
		kind: translateCompletionKind(kind),
		kindModifiers: completion.kindModifiers,
		sortText: importance === "high" ? "0" : importance === "medium" ? "1" : "2",
		insertText: insert,
		...(range != null ? { replacementSpan: translateRange(range) } : {})
	};
}

function translateCompletionKind(kind: LitCompletionKind): ScriptElementKind {
	switch (kind) {
		case "memberFunctionElement":
			return tsModule.ts.ScriptElementKind.memberFunctionElement;
		case "functionElement":
			return tsModule.ts.ScriptElementKind.functionElement;
		case "constructorImplementationElement":
			return tsModule.ts.ScriptElementKind.constructorImplementationElement;
		case "variableElement":
			return tsModule.ts.ScriptElementKind.variableElement;
		case "classElement":
			return tsModule.ts.ScriptElementKind.classElement;
		case "interfaceElement":
			return tsModule.ts.ScriptElementKind.interfaceElement;
		case "moduleElement":
			return tsModule.ts.ScriptElementKind.moduleElement;
		case "memberVariableElement":
		case "member":
			return tsModule.ts.ScriptElementKind.memberVariableElement;
		case "constElement":
			return tsModule.ts.ScriptElementKind.constElement;
		case "enumElement":
			return tsModule.ts.ScriptElementKind.enumElement;
		case "keyword":
			return tsModule.ts.ScriptElementKind.keyword;
		case "alias":
			return tsModule.ts.ScriptElementKind.alias;
		case "label":
			return tsModule.ts.ScriptElementKind.label;
		default:
			return tsModule.ts.ScriptElementKind.unknown;
	}
}
