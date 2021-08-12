import { SimpleType, typeToString } from "ts-simple-type";
import { HtmlNodeAttr } from "../../../analyze/types/html-node/html-node-attr-types.js";
import { RuleModuleContext } from "../../../analyze/types/rule/rule-module-context.js";
import { rangeFromHtmlNodeAttr } from "../../../analyze/util/range-util.js";
import { isLitDirective } from "../directive/is-lit-directive.js";

/**
 * Checks that the type represents a directive, which is the only valid
 * value for element expressions.
 *
 * Note: This currently checks against the lit-html 1.x interface for a
 * directive. When lit-analyzer can detect Lit 2 directives it will check that
 * the directive is specifically a Lit 2 directive.
 */
export function isAssignableInElementBinding(htmlAttr: HtmlNodeAttr, type: SimpleType, context: RuleModuleContext): boolean | undefined {
	// TODO (justinfagnani): is there a better way to determine if the
	// type *contains* any, rather than *is* any?
	if (!isLitDirective(type) && !(type.kind === "ANY")) {
		context.report({
			location: rangeFromHtmlNodeAttr(htmlAttr),
			message: `Type '${typeToString(type)}' is not a directive'`
		});
		return false;
	}

	return true;
}
