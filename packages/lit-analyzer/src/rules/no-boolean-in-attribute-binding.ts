import { toTypeString, isAssignableToSimpleTypeKind, SimpleTypeKind, isAssignableToType, SimpleType } from "ts-simple-type";
import { RuleModule } from "../analyze/types/rule-module";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttr } from "../analyze/types/html-node/html-node-attr-types";
import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types";
import { extractAttributeTypes, isValidStringAssignment } from "../analyze/util/attribute-util";
import { lazy } from "../analyze/util/general-util";
import {
	LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER,
	LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER,
	LIT_HTML_PROP_ATTRIBUTE_MODIFIER
} from "../analyze/constants";

const STRINGIFIED_BOOLEAN_TYPE: SimpleType = {
	kind: SimpleTypeKind.UNION,
	types: [
		{
			kind: SimpleTypeKind.STRING_LITERAL,
			value: "true"
		},
		{ kind: SimpleTypeKind.STRING_LITERAL, value: "false" }
	]
};

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
			const typeAIsAssignableTo = {
				[SimpleTypeKind.STRING]: lazy(() =>
					isAssignableToSimpleTypeKind(typeA, [SimpleTypeKind.STRING, SimpleTypeKind.STRING_LITERAL], { op: "or" })
				),
				[SimpleTypeKind.NUMBER]: lazy(() =>
					isAssignableToSimpleTypeKind(typeA, [SimpleTypeKind.NUMBER, SimpleTypeKind.NUMBER_LITERAL], { op: "or" })
				),
				[SimpleTypeKind.BOOLEAN]: lazy(() =>
					isAssignableToSimpleTypeKind(typeA, [SimpleTypeKind.BOOLEAN, SimpleTypeKind.BOOLEAN_LITERAL], { op: "or" })
				),
				[SimpleTypeKind.ARRAY]: lazy(() => isAssignableToSimpleTypeKind(typeA, [SimpleTypeKind.ARRAY, SimpleTypeKind.TUPLE], { op: "or" })),
				[SimpleTypeKind.OBJECT]: lazy(() =>
					isAssignableToSimpleTypeKind(typeA, [SimpleTypeKind.OBJECT, SimpleTypeKind.INTERFACE, SimpleTypeKind.CLASS], { op: "or" })
				)
			};
			const typeAIsAssignableToMultiple = lazy(() => Object.values(typeAIsAssignableTo).filter(assignable => assignable()).length > 1);

			if (
				isAssignableToSimpleTypeKind(typeB, [SimpleTypeKind.NUMBER, SimpleTypeKind.NUMBER_LITERAL], { op: "or" }) &&
				typeAIsAssignableTo[SimpleTypeKind.STRING]()
			) {
				return;
			}

			if (
				isAssignableToSimpleTypeKind(typeB, [SimpleTypeKind.BOOLEAN, SimpleTypeKind.BOOLEAN_LITERAL], { op: "or" }) &&
				!isAssignableToType(typeA, STRINGIFIED_BOOLEAN_TYPE, context.program)
			) {
				context.reports.push({
					kind: LitHtmlDiagnosticKind.EXPRESSION_ONLY_ASSIGNABLE_WITH_BOOLEAN_BINDING,
					severity: litDiagnosticRuleSeverity(context.config, "no-boolean-in-attribute-binding"),
					source: "no-boolean-in-attribute-binding",
					message: `The type '${toTypeString(typeB)}' is a boolean type but you are not using a boolean binding. Change to boolean binding?`,
					location: { document, ...node.location.name },
					htmlAttr: node,
					typeA,
					typeB
				});
			}

			// Take into account that assigning to a boolean without "?" binding would result in "undefined" being assigned.
			// Example: <input disabled="${true}" />
			else if (typeAIsAssignableTo[SimpleTypeKind.BOOLEAN]() && !typeAIsAssignableToMultiple()) {
				context.reports.push({
					kind: LitHtmlDiagnosticKind.EXPRESSION_ONLY_ASSIGNABLE_WITH_BOOLEAN_BINDING,
					severity: litDiagnosticRuleSeverity(context.config, "no-boolean-in-attribute-binding"),
					source: "no-boolean-in-attribute-binding",
					message: `The '${node.name}' attribute is of boolean type but you are not using a boolean binding. Change to boolean binding?`,
					location: { document, ...node.location.name },
					htmlAttr: node,
					typeA,
					typeB
				});
			}
		}
	};
};

export default rule;
