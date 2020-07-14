import { RuleModule } from "../analyze/types/rule/rule-module";
import { isCustomElementTagName } from "../analyze/util/is-valid-name";
import { rangeFromHtmlNode } from "../analyze/util/range-util";

/**
 * This rule makes sure that all custom elements used are imported in a given file.
 */
const rule: RuleModule = {
	id: "no-unused-import",
	meta: {
		priority: "low"
	}
};

export default rule;
