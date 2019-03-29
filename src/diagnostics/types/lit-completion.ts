import { Range } from "../../types/range";

export type LitCompletionKind =
	| "memberFunctionElement"
	| "functionElement"
	| "constructorImplementationElement"
	| "variableElement"
	| "classElement"
	| "interfaceElement"
	| "moduleElement"
	| "memberVariableElement"
	| "constElement"
	| "enumElement"
	| "keyword"
	| "constElement"
	| "alias"
	| "moduleElement"
	| "member"
	| "label"
	| "unknown";

export interface LitCompletion {
	name: string;
	kind: LitCompletionKind;
	kindModifiers?: "color";
	insert: string;
	range?: Range;
	importance?: "high" | "medium" | "low";
	documentation?(): string | undefined;
}
