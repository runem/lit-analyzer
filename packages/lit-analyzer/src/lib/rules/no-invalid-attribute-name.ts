import { Node } from "typescript";
import { RuleModule } from "../analyze/types/rule/rule-module";
import { isValidAttributeName } from "../analyze/util/is-valid-name";
import { rangeFromNode } from "../analyze/util/range-util";

const rule: RuleModule = {
	id: "no-invalid-attribute-name",
	meta: {
		priority: "low"
	},
	visitComponentMember(member, context) {
		// Check if the tag name is invalid
		let attrName: undefined | string;
		let attrNameNode: undefined | Node;

		if (member.kind === "attribute") {
			attrName = member.attrName;
			attrNameNode = member.node;
		} else if (typeof member.meta?.attribute === "string") {
			attrName = member.meta.attribute;
			attrNameNode = member.meta.node?.attribute || member.node;
		}

		if (attrName != null && attrNameNode != null && attrNameNode.getSourceFile() === context.file && !isValidAttributeName(attrName)) {
			context.report({
				location: rangeFromNode(attrNameNode),
				message: `'${attrName}' is not a valid attribute name.`
			});
		}
	}
};

export default rule;
