import { SimpleType, typeToString } from "ts-simple-type";
import { HtmlNodeAttr } from "../../../analyze/types/html-node/html-node-attr-types.js";
import { RuleModuleContext } from "../../../analyze/types/rule/rule-module-context.js";
import { rangeFromHtmlNodeAttr } from "../../../analyze/util/range-util.js";
import { isLit2Directive, isLit1Directive } from "../directive/is-lit-directive.js";

/**
 * Checks that the type represents a Lit 2 directive, which is the only valid
 * value for element expressions.
 */
export function isAssignableInElementBinding(htmlAttr: HtmlNodeAttr, type: SimpleType, context: RuleModuleContext): boolean | undefined {
	// TODO (justinfagnani): is there a better way to determine if the
	// type *contains* any, rather than *is* any?
	if (!isLit2Directive(type) && type.kind !== "ANY") {
		if (isLit1Directive(type)) {
			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message: `Type '${typeToString(type)}' is a lit-html 1.0 directive, not a Lit 2 directive'`
			});
		} else {
			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message: `Type '${typeToString(type)}' is not a Lit 2 directive'`
			});
		}
		return false;
	}

	return true;
}
