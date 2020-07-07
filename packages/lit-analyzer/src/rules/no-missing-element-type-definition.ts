import { RuleModule } from "../analyze/types/rule/rule-module";
import { findParent, getNodeIdentifier } from "../analyze/util/ast-util";
import { iterableFind } from "../analyze/util/iterable-util";
import { rangeFromNode } from "../analyze/util/range-util";

/**
 * This rule validates that legacy Polymer attribute bindings are not used.
 */
const rule: RuleModule = {
	id: "no-missing-element-type-definition",
	meta: {
		priority: "low"
	},
	visitComponentDefinition(definition, context) {
		// Don't run this rule on non-typescript files and declaration files
		if (context.file.isDeclarationFile || !context.file.fileName.endsWith(".ts")) {
			return;
		}

		// Try to find the tag name node on "interface HTMLElementTagNameMap"
		const htmlElementTagNameMapTagNameNode = iterableFind(
			definition.tagNameNodes,
			node =>
				findParent(
					node,
					node => context.ts.isInterfaceDeclaration(node) && context.ts.isModuleBlock(node.parent) && node.name.getText() === "HTMLElementTagNameMap"
				) != null
		);

		// Don't continue if the node was found
		if (htmlElementTagNameMapTagNameNode != null) {
			return;
		}

		// Find the identifier node
		const declarationIdentifier = getNodeIdentifier(definition.declaration().node, context.ts);
		if (declarationIdentifier == null) {
			return;
		}

		// Only report diagnostic if the tag is not built in,
		const tag = context.htmlStore.getHtmlTag(definition.tagName);

		if (!tag?.builtIn) {
			context.report({
				location: rangeFromNode(declarationIdentifier),
				message: `'${definition.tagName}' has not been registered on HTMLElementTagNameMap`,
				fix: () => {
					return {
						message: `Register '${definition.tagName}' on HTMLElementTagNameMap`,
						actions: [
							{
								kind: "extendGlobalDeclaration",
								file: context.file,
								name: "HTMLElementTagNameMap",
								newMembers: [`"${definition.tagName}": ${declarationIdentifier.text}`]
							}
						]
					};
				}
			});
		}
	}
};

export default rule;
