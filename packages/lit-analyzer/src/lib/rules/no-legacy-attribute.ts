import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types.js";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types.js";
import { HtmlNodeKind } from "../analyze/types/html-node/html-node-types.js";
import { RuleModule } from "../analyze/types/rule/rule-module.js";
import { rangeFromHtmlNodeAttr } from "../analyze/util/range-util.js";

const LEGACY_ASSIGNMENT = /^(\[\[[^\]]+\]\]|{{[^}]+}})/;

/**
 * This rule validates that legacy Polymer attribute bindings are not used.
 */
const rule: RuleModule = {
	id: "no-legacy-attribute",
	meta: {
		priority: "medium"
	},
	visitHtmlAttribute(htmlAttr, context) {
		if (htmlAttr.htmlNode.kind !== HtmlNodeKind.NODE) {
			return;
		}

		if (htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE && htmlAttr.kind !== HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE) {
			return;
		}

		//const suggestedTarget = suggestTargetForHtmlAttr(htmlAttr, htmlStore);
		const suggestedName = getSuggestedName(htmlAttr.name);

		if (suggestedName !== htmlAttr.name) {
			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message: `Legacy Polymer binding syntax in attribute '${htmlAttr.name}'.`,
				fixMessage: `Did you mean '${suggestedName}'?`,
				suggestion: "Legacy Polymer binding syntax is not supported in Lit."
				/*fix: () => ({
					message: `Change to '${suggestedName}'`,
					actions: [{ kind: "changeAttributeName", htmlAttr, newName: suggestedName }]
				})*/
			});
		}
	},
	visitHtmlAssignment(assignment, context) {
		if (assignment.kind !== HtmlNodeAttrAssignmentKind.STRING) {
			return;
		}

		const htmlAttr = assignment.htmlAttr;

		if (LEGACY_ASSIGNMENT.test(assignment.value)) {
			//const suggestedTarget = suggestTargetForHtmlAttr(htmlAttr, htmlStore);

			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message: `Legacy Polymer binding syntax in attribute '${htmlAttr.name}'.`,
				suggestion: "Legacy Polymer binding syntax is not supported in Lit." + ' Instead you should use JavaScript interpolation, e.g. "attr=${foo}".'
				//suggestedTarget
			});
		}
	}
};

export default rule;

/**
 * Determines the non-legacy attribute name equivalent of the given name
 * @param name legacy name
 */
function getSuggestedName(name: string): string {
	if (name.endsWith("?")) {
		return `?${name.slice(0, -1)}`;
	}
	if (name.endsWith("$")) {
		return `${name.slice(0, -1)}`;
	}
	return name;
}
