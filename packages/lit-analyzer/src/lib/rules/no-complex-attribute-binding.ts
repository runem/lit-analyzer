import { isAssignableToPrimitiveType, typeToString } from "ts-simple-type";
import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types.js";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types.js";
import { RuleModule } from "../analyze/types/rule/rule-module.js";
import { rangeFromHtmlNodeAttr } from "../analyze/util/range-util.js";
import { isLitDirective } from "./util/directive/is-lit-directive.js";
import { extractBindingTypes } from "./util/type/extract-binding-types.js";
import { isAssignableBindingUnderSecuritySystem } from "./util/type/is-assignable-binding-under-security-system.js";

/**
 * This rule validates that complex types are not used within an expression in an attribute binding.
 */
const rule: RuleModule = {
	id: "no-complex-attribute-binding",
	meta: {
		priority: "medium"
	},
	visitHtmlAssignment(assignment, context) {
		// Only validate attribute bindings, because you are able to assign complex types in property bindings.
		const { htmlAttr } = assignment;
		if (htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE) return;

		// Ignore element expressions
		if (assignment.kind === HtmlNodeAttrAssignmentKind.ELEMENT_EXPRESSION) return;

		const { typeA, typeB } = extractBindingTypes(assignment, context);

		// Don't validate directives in this rule, because they are assignable even though they are complex types (functions).
		if (isLitDirective(typeB)) return;

		const htmlAttrTarget = context.htmlStore.getHtmlAttrTarget(htmlAttr);
		const hasConverter = htmlAttrTarget?.declaration?.meta?.hasConverter;

		// Only primitive types should be allowed as "typeB"
		if (!isAssignableToPrimitiveType(typeB)) {
			if (isAssignableBindingUnderSecuritySystem(htmlAttr, { typeA, typeB }, context) !== undefined) {
				// This is binding via a security sanitization system, let it do
				// this check. Apparently complex values are OK to assign here.
				return;
			}

			const message = `You are binding a non-primitive type '${typeToString(typeB)}'. This could result in binding the string "[object Object]".`;
			const newModifier = ".";

			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message,
				fixMessage: `Use '${newModifier}' binding instead?`,
				fix: () => ({
					message: `Use '${newModifier}' modifier instead`,
					actions: [
						{
							kind: "changeAttributeModifier",
							htmlAttr,
							newModifier
						}
					]
				})
			});
		}

		// Only primitive types should be allowed as "typeA"
		else if (!hasConverter && !isAssignableToPrimitiveType(typeA)) {
			const message = `You are assigning the primitive '${typeToString(typeB)}' to a non-primitive type '${typeToString(typeA)}'.`;
			const newModifier = ".";

			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message,
				fixMessage: `Use '${newModifier}' binding instead?`,
				fix: () => ({
					message: `Use '${newModifier}' modifier instead`,
					actions: [
						{
							kind: "changeAttributeModifier",
							htmlAttr,
							newModifier
						}
					]
				})
			});
		}
	}
};

export default rule;
