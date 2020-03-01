import { RuleModule } from "../analyze/types/rule/rule-module";
import { isValidCustomElementName } from "../analyze/util/is-valid-name";
import { iterableFirst } from "../analyze/util/iterable-util";
import { rangeFromNode } from "../analyze/util/range-util";

const rule: RuleModule = {
	id: "no-invalid-tag-name",
	meta: {
		priority: "low"
	},
	visitComponentDefinition(definition, context) {
		// Check if the tag name is invalid
		if (!isValidCustomElementName(definition.tagName)) {
			const node = iterableFirst(definition.tagNameNodes) || iterableFirst(definition.identifierNodes);

			// Only report diagnostic if the tag is not built in,
			//  because this function among other things tests for missing "-" in custom element names
			const tag = context.htmlStore.getHtmlTag(definition.tagName);
			if (node != null && tag != null && !tag.builtIn) {
				context.report({
					location: rangeFromNode(node),
					message: `'${definition.tagName}' is not a valid custom element name.`
				});
			}
		}
	}
};

export default rule;
