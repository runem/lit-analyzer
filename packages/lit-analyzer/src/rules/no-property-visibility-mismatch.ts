import { Identifier } from "typescript";
import { ComponentMember } from "web-component-analyzer";
import { RuleFixActionChangeRange } from "../analyze/types/rule/rule-fix-action";
import { RuleModule } from "../analyze/types/rule/rule-module";
import { RuleModuleContext } from "../analyze/types/rule/rule-module-context";
import { makeSourceFileRange, rangeFromNode } from "../analyze/util/range-util";

/**
 * Returns the identifier of the decorator used on the member if any
 * @param member
 * @param context
 */
const getDecoratorIdentifier = (member: ComponentMember, context: RuleModuleContext): Identifier | undefined => {
	const decorator = member.meta?.node?.decorator;

	if (decorator !== undefined && context.ts.isCallExpression(decorator) && context.ts.isIdentifier(decorator.expression)) {
		return decorator.expression;
	}

	return undefined;
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
		// Only run this rule on members of "property" kind
		if (member.kind !== "property") {
			return;
		}

		// Get the decorator of the property if any
		const decoratorIdentifier = getDecoratorIdentifier(member, context);
		if (decoratorIdentifier == null) {
			return;
		}

		// Get the decorator of interest
		const decoratorName = decoratorIdentifier.text;
		const hasInternalDecorator = decoratorName === "internalProperty";
		const hasPropertyDecorator = decoratorName === "property";

		// Handle cases where @internalProperty decorator is used, but the property is public
		if (hasInternalDecorator && (member.visibility === "public" || member.visibility == null)) {
			const inJsFile = context.file.fileName.endsWith(".js");

			context.report({
				location: rangeFromNode(decoratorIdentifier),
				message: `'${member.propName}' is marked as an internal property (@internalProperty) but is publicly accessible.`,
				...(inJsFile
					? {
							// We are in Javascript context. Add "@properted" or "@private" JSDoc
					  }
					: {
							// We are in Typescript context. Add "protected" or "private" keyword
							fixMessage: "Change the property access to 'private' or 'protected'?",
							fix: () => {
								// Make sure we operate on a property declaration
								const propertyDeclaration = member.node;
								if (!context.ts.isPropertyDeclaration(propertyDeclaration)) {
									return [];
								}

								// The modifiers the user can choose to add to fix this warning/error
								const modifiers = ["protected", "private"];

								// Get the public modifier if any. If one exists, we want to change that one.
								const publicModifier = propertyDeclaration.modifiers?.find(modifier => modifier.kind === context.ts.SyntaxKind.PublicKeyword);

								if (publicModifier != null) {
									// Return actions that can replace the modifier
									return modifiers.map(keyword => ({
										message: `Change to '${keyword}'`,
										actions: [
											{
												kind: "changeRange",
												range: rangeFromNode(publicModifier),
												newText: keyword
											} as RuleFixActionChangeRange
										]
									}));
								}

								// If there is no existing visibility modifier, add a new modifier right in front of the property name (identifier)
								const propertyIdentifier = propertyDeclaration.name;
								if (propertyIdentifier != null) {
									// Return actions that can add a modifier in front of the identifier
									return modifiers.map(keyword => ({
										message: `Add '${keyword}' modifier`,
										actions: [
											{
												kind: "changeRange",
												range: makeSourceFileRange({
													start: propertyIdentifier.getStart() - 1,
													end: propertyIdentifier.getStart() - 1
												}),
												newText: `${keyword} `
											} as RuleFixActionChangeRange
										]
									}));
								}

								return [];
							}
					  })
			});
		}

		// Handle cases where @property decorator is used, but the property is not public
		else if (hasPropertyDecorator && member.visibility !== "public") {
			context.report({
				location: rangeFromNode(decoratorIdentifier),
				message: `'${member.propName}' is not publicly accessible but is marked as a public property (@property).`,
				fixMessage: "Use the '@internalProperty' decorator instead?",
				fix: () => {
					// Return a code action that can replace the identifier of the decorator
					const newText = `internalProperty`;

					return {
						message: `Change to '${newText}'`,
						actions: [
							{
								kind: "changeIdentifier",
								identifier: decoratorIdentifier,
								newText
							}
						]
					};
				}
			});
		}
	}
};

export default rule;
