import { SimpleType, toTypeString } from "ts-simple-type";
import { litDiagnosticRuleSeverity } from "../../lit-analyzer-config";
import { LitAnalyzerRequest } from "../../lit-analyzer-context";
import { HtmlNodeAttr } from "../../types/html-node/html-node-attr-types";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../../types/lit-diagnostic";
import { isAssignableToType } from "./is-assignable-to-type";
import { isAssignableBindingUnderSecuritySystem } from "./is-assignable-binding-under-security-system";

export function isAssignableInPropertyBinding(
	htmlAttr: HtmlNodeAttr,
	{ typeA, typeB }: { typeA: SimpleType; typeB: SimpleType },
	request: LitAnalyzerRequest
): LitHtmlDiagnostic[] | undefined {
	const securityDiagnostics = isAssignableBindingUnderSecuritySystem(htmlAttr, { typeA, typeB }, request, "no-incompatible-type-binding");
	if (securityDiagnostics !== undefined) {
		// The security diagnostics take precedence here, and we should not
		// do any more checking. Note that this may be an empty array.
		return securityDiagnostics;
	}

	if (!isAssignableToType({ typeA, typeB }, request)) {
		return [
			{
				kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE,
				message: `Type '${toTypeString(typeB)}' is not assignable to '${toTypeString(typeA)}'`,
				severity: litDiagnosticRuleSeverity(request.config, "no-incompatible-type-binding"),
				source: "no-incompatible-type-binding",
				location: { document: request.document, ...htmlAttr.location.name },
				htmlAttr,
				typeA,
				typeB
			}
		];
	}

	return undefined;
}
