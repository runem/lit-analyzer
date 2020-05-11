import { ComponentMember } from "web-component-analyzer";
import { RuleModule } from "../analyze/types/rule/rule-module";
import { rangeFromNode } from "../analyze/util/range-util";
import { RuleModuleContext } from "../analyze/types/rule/rule-module-context";

const isInternalProperty = (context: RuleModuleContext, member: ComponentMember): boolean => {
	return member.kind === "property" &&
		context.ts.isPropertyDeclaration(member.node) &&
		member.node.decorators?.some((d) =>
			context.ts.isCallExpression(d.expression) &&
			context.ts.isIdentifier(d.expression.expression) &&
			d.expression.expression.escapedText === "internalProperty") === true;
};

/**
 * This rule detects mismatches with property visibilities and the decorators
 * they were defined with.
 */
const rule: RuleModule = {
	id: "no-property-visibility-mismatch",
	meta: {
		priority: "low"
	},
	visitComponentMember(member, context) {
		if (member.kind === "property") {
			const isInternal = isInternalProperty(context, member);

			if (isInternal && member.visibility === "public") {
				context.report({
					location: rangeFromNode(member.node),
					message: `'${member.propName}' is marked as an internal property (@internalProperty) but is publicly visible.`,
					suggestion: "Change the property visibility to 'private' or 'protected'."
				});
			}

			if (!isInternal && member.visibility !== "public") {
				context.report({
					location: rangeFromNode(member.node),
					message: `'${member.propName}' is not publicy visible but is not marked as an internal property (@internalProperty).`,
					suggestion: "Add the '@internalProperty' decorator instead of '@property'."
				});
			}
		}
	}
};

export default rule;
