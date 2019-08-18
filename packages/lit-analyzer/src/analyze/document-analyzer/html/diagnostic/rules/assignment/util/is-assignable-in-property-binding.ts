import { SimpleType, toTypeString } from "ts-simple-type";
import { litDiagnosticRuleSeverity } from "../../../../../../lit-analyzer-config";
import { LitAnalyzerRequest } from "../../../../../../lit-analyzer-context";
import { HtmlNodeAttr } from "../../../../../../types/html-node/html-node-attr-types";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../../../../../../types/lit-diagnostic";
import { isAssignableToType } from "./is-assignable-to-type";

export function isAssignableInPropertyBinding(
	htmlAttr: HtmlNodeAttr,
	{ typeA, typeB }: { typeA: SimpleType; typeB: SimpleType },
	request: LitAnalyzerRequest
): LitHtmlDiagnostic[] | undefined {
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
