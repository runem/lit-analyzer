import { isAssignableToSimpleTypeKind, SimpleTypeKind, toTypeString } from "ts-simple-type";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";
import { extractBindingTypes } from "../analyze/util/type/extract-binding-types";

const rule: RuleModule = {
	name: "no-nullable-attribute-binding",
	visitHtmlAssignment(assignment, request) {
		if (assignment.kind !== HtmlNodeAttrAssignmentKind.EXPRESSION) return;

		const { htmlAttr } = assignment;
		if (htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE) return;

		const { typeA, typeB } = extractBindingTypes(assignment, request);

		// Test if removing "null" from typeB would work and suggest using "ifDefined(exp === null ? undefined : exp)".
		if (isAssignableToSimpleTypeKind(typeB, SimpleTypeKind.NULL)) {
			return [
				{
					kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE_NULL,
					message: `This attribute binds the type '${toTypeString(typeB)}' which can be 'null'. Fix it using 'ifDefined' and strict equality check?`,
					source: "no-nullable-attribute-binding",
					severity: litDiagnosticRuleSeverity(request.config, "no-nullable-attribute-binding"),
					location: { document: request.document, ...htmlAttr.location.name },
					htmlAttr: htmlAttr as typeof htmlAttr & ({ assignment: typeof assignment }),
					typeA,
					typeB
				}
			];
		}

		// Test if removing "undefined" from typeB would work and suggest using "ifDefined".
		else if (isAssignableToSimpleTypeKind(typeB, SimpleTypeKind.UNDEFINED)) {
			//const typeBWithoutUndefined = removeUndefinedFromType(typeB);
			//const assignableWithoutUndefined = isAssignableToType(typeA, typeBWithoutUndefined, program);
			return [
				{
					kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE_UNDEFINED,
					message: `This attribute binds the type '${toTypeString(typeB)}' which can be 'undefined'. Fix it using 'ifDefined'?`,
					source: "no-nullable-attribute-binding",
					severity: litDiagnosticRuleSeverity(request.config, "no-nullable-attribute-binding"),
					location: { document: request.document, ...htmlAttr.location.name },
					htmlAttr: htmlAttr as typeof htmlAttr & ({ assignment: typeof assignment }),
					typeA,
					typeB
				}
			];
		}

		return;
	}
};
export default rule;
