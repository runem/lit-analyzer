import { isAssignableToPrimitiveType, toTypeString } from "ts-simple-type";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";
import { extractBindingTypes } from "../analyze/util/type/extract-binding-types";

const rule: RuleModule = {
	name: "no-complex-attribute-binding",
	visitHtmlAssignment(assignment, request) {
		const { htmlAttr } = assignment;
		if (htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE) return;

		const { typeA, typeB } = extractBindingTypes(assignment, request);

		// Only primitive types should be allowed as "typeB" and "typeA".
		if (!isAssignableToPrimitiveType(typeB)) {
			return [
				{
					kind: LitHtmlDiagnosticKind.COMPLEX_NOT_BINDABLE_IN_ATTRIBUTE_BINDING,
					severity: litDiagnosticRuleSeverity(request.config, "no-complex-attribute-binding"),
					source: "no-complex-attribute-binding",
					message: `You are binding a non-primitive type '${toTypeString(typeB)}'. This could result in binding the string "[object Object]".`,
					location: { document: request.document, ...htmlAttr.location.name },
					htmlAttr,
					typeA,
					typeB
				}
			];
		}

		if (!isAssignableToPrimitiveType(typeA)) {
			const message = `You are assigning the primitive '${toTypeString(typeB)}' to a non-primitive type '${toTypeString(
				typeA
			)}'. Use '.' binding instead?`;

			// Fail if the user is trying to assign a primitive value to a complex value.
			return [
				{
					kind: LitHtmlDiagnosticKind.PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX,
					severity: litDiagnosticRuleSeverity(request.config, "no-complex-attribute-binding"),
					source: "no-complex-attribute-binding",
					message,
					location: { document: request.document, ...htmlAttr.location.name },
					htmlAttr,
					typeA,
					typeB
				}
			];
		}

		return;
	}
};

export default rule;
