import { isAssignableToPrimitiveType, toTypeString } from "ts-simple-type";
import { RuleModule } from "../analyze/types/rule-module";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttr } from "../analyze/types/html-node/html-node-attr-types";
import { extractAttributeTypes } from "../analyze/util/attribute-util";
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
				htmlAttrTarget &&
				node.modifier !== LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER &&
				node.modifier !== LIT_HTML_PROP_ATTRIBUTE_MODIFIER &&
				node.modifier !== LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER
			) {
				const types = extractAttributeTypes(context, node);

				if (!types) {
					return;
				}

				const { typeA, typeB } = types;

				if (!isAssignableToPrimitiveType(typeB)) {
					context.reports.push({
						kind: LitHtmlDiagnosticKind.COMPLEX_NOT_BINDABLE_IN_ATTRIBUTE_BINDING,
						severity: litDiagnosticRuleSeverity(context.config, "no-complex-attribute-binding"),
						source: "no-complex-attribute-binding",
						message: `You are binding a non-primitive type '${toTypeString(typeB)}'. This could result in binding the string "[object Object]".`,
						location: { document, ...node.location.name },
						htmlAttr: node,
						typeA,
						typeB
					});
				} else if (!isAssignableToPrimitiveType(typeA)) {
					const message = `You are assigning the primitive '${toTypeString(typeB)}' to a non-primitive type '${toTypeString(
						typeA
					)}'. Use '.' binding instead?`;

					context.reports.push({
						kind: LitHtmlDiagnosticKind.PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX,
						severity: litDiagnosticRuleSeverity(context.config, "no-complex-attribute-binding"),
						source: "no-complex-attribute-binding",
						message,
						location: { document, ...node.location.name },
						htmlAttr: node,
						typeA,
						typeB
					});
				}
			}
		}
	};
};

export default rule;
