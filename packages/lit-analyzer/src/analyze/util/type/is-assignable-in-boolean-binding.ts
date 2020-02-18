import { SimpleType, SimpleTypeKind, toTypeString } from "ts-simple-type";
import { litDiagnosticRuleSeverity } from "../../lit-analyzer-config";
import { LitAnalyzerRequest } from "../../lit-analyzer-context";
import { HtmlNodeAttr } from "../../types/html-node/html-node-attr-types";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../../types/lit-diagnostic";
import { rangeFromHtmlNodeAttr } from "../lit-range-util";
import { isAssignableToType } from "./is-assignable-to-type";

export function isAssignableInBooleanBinding(
	htmlAttr: HtmlNodeAttr,
	{ typeA, typeB }: { typeA: SimpleType; typeB: SimpleType },
	request: LitAnalyzerRequest
): LitHtmlDiagnostic[] | undefined {
	// Test if the user is trying to use ? modifier on a non-boolean type.
	if (!isAssignableToType({ typeA: { kind: SimpleTypeKind.BOOLEAN }, typeB }, request)) {
		return [
			{
				kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE,
				message: `Type '${toTypeString(typeB)}' is not assignable to 'boolean'`,
				severity: litDiagnosticRuleSeverity(request.config, "no-incompatible-type-binding"),
				source: "no-incompatible-type-binding",
				location: rangeFromHtmlNodeAttr(request.document, htmlAttr),
				file: request.file,
				htmlAttr,
				typeA,
				typeB
			}
		];
	}

	// Test if the user is trying to use the ? modifier on a non-boolean type.
	if (!isAssignableToType({ typeA, typeB: { kind: SimpleTypeKind.BOOLEAN } }, request)) {
		return [
			{
				kind: LitHtmlDiagnosticKind.BOOL_MOD_ON_NON_BOOL,
				message: `You are using a boolean binding on a non boolean type '${toTypeString(typeA)}'`,
				severity: litDiagnosticRuleSeverity(request.config, "no-incompatible-type-binding"),
				source: "no-incompatible-type-binding",
				location: rangeFromHtmlNodeAttr(request.document, htmlAttr),
				file: request.file,
				htmlAttr,
				typeA: { kind: SimpleTypeKind.BOOLEAN },
				typeB
			}
		];
	}

	return undefined;
}
