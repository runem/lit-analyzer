import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { RuleModule } from "../analyze/types/rule/rule-module";
import { rangeFromHtmlNodeAttr } from "../analyze/util/range-util";

const CONTROL_CHARACTERS = ["'", '"', "}", "/"];

/**
 * This rule validates that bindings are not followed by certain characters that indicate typos.
 *
 * Examples:
 *   <input value=${val}' />
 *   <input value='${val}'' />
 *   <input value=${val}} />
 */
const rule: RuleModule = {
	id: "no-unintended-mixed-binding",
	meta: {
		priority: "high"
	},
	visitHtmlAssignment(assignment, context) {
		// Check only mixed bindings
		if (assignment.kind !== HtmlNodeAttrAssignmentKind.MIXED) {
			return;
		}

		// Only check mixed bindings with 2 values
		if (assignment.values.length !== 2) {
			return;
		}

		// Event listener binding ignores mixed bindings.
		// This kind of binding only uses the first expression present in the mixed binding.
		if (assignment.htmlAttr.kind === HtmlNodeAttrKind.EVENT_LISTENER) {
			return;
		}

		// Ensure the last value is a string literal
		const secondAssignment = assignment.values[1];
		if (typeof secondAssignment !== "string") {
			return;
		}

		// Report error if the string literal is one of the control characters
		if (CONTROL_CHARACTERS.includes(secondAssignment)) {
			const quoteChar = secondAssignment === "'" ? '"' : "'";

			const message = (() => {
				switch (secondAssignment) {
					case "/":
						return `This binding is directly followed by a '/' which is probably unintended.`;
					default:
						return `This binding is directly followed by an unmatched ${quoteChar}${secondAssignment}${quoteChar} which is probably unintended.`;
				}
			})();

			context.report({
				location: rangeFromHtmlNodeAttr(assignment.htmlAttr),
				message
			});
		}

		return;
	}
};

export default rule;
