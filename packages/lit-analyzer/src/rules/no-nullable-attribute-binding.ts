import { toTypeString, isAssignableToSimpleTypeKind, SimpleTypeKind } from "ts-simple-type";
import { RuleModule } from "../analyze/types/rule-module";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttr } from "../analyze/types/html-node/html-node-attr-types";
import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types";
import { extractAttributeTypes, isValidStringAssignment } from "../analyze/util/attribute-util";
import {
	LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER,
	LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER,
	LIT_HTML_PROP_ATTRIBUTE_MODIFIER
} from "../analyze/constants";

const rule: RuleModule = context => {
	return {
		enterHtmlAttribute(node: HtmlNodeAttr) {
			const { assignment } = node;

			if (assignment == null) {
				return;
			}

			const { document } = context;
			const htmlAttrTarget = context.htmlStore.getHtmlAttrTarget(node);

			if (
				!htmlAttrTarget ||
				node.modifier === LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER ||
				node.modifier === LIT_HTML_PROP_ATTRIBUTE_MODIFIER ||
				node.modifier === LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER ||
				assignment.kind !== HtmlNodeAttrAssignmentKind.EXPRESSION
			) {
				return;
			}

			const types = extractAttributeTypes(context, node);

			if (!types || isValidStringAssignment(types.typeA, types.typeB)) {
				return;
			}

			const { typeA, typeB } = types;

			if (isAssignableToSimpleTypeKind(typeB, SimpleTypeKind.NULL)) {
				context.reports.push({
					kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE_NULL,
					message: `This attribute binds the type '${toTypeString(typeB)}' which can be 'null'. Fix it using 'ifDefined' and strict equality check?`,
					source: "no-nullable-attribute-binding",
					severity: litDiagnosticRuleSeverity(context.config, "no-nullable-attribute-binding"),
					location: { document, ...node.location.name },
					htmlAttr: node as typeof node & ({ assignment: typeof assignment }),
					typeA,
					typeB
				});
			}

			// Test if removing "undefined" from typeB would work and suggest using "ifDefined".
			else if (isAssignableToSimpleTypeKind(typeB, SimpleTypeKind.UNDEFINED)) {
				context.reports.push({
					kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE_UNDEFINED,
					message: `This attribute binds the type '${toTypeString(typeB)}' which can be 'undefined'. Fix it using 'ifDefined'?`,
					source: "no-nullable-attribute-binding",
					severity: litDiagnosticRuleSeverity(context.config, "no-nullable-attribute-binding"),
					location: { document, ...node.location.name },
					htmlAttr: node as typeof node & ({ assignment: typeof assignment }),
					typeA,
					typeB
				});
			}
		}
	};
};

export default rule;
