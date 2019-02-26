import { findChild } from "../../../../util/ast-util";
import { Node, StringLiteral } from "typescript";
import { ParseVisitContextComponentDefinition } from "../../parse-component-flavor";

export function visitComponentDefinitions(node: Node, context: ParseVisitContextComponentDefinition) {
	const { ts } = context;

	// @customElement("my-element")
	if (ts.isClassDeclaration(node)) {
		for (const decorator of node.decorators || []) {
			const callExpression = decorator.expression;
			if (ts.isCallExpression(callExpression) && ts.isIdentifier(callExpression.expression)) {
				const decoratorIdentifierName = callExpression.expression.escapedText;
				if (decoratorIdentifierName === "customElement") {
					const tagNameNode = findChild<StringLiteral>(callExpression.arguments[0], ts.isStringLiteralLike);

					if (tagNameNode != null) {
						context.emitDefinition(tagNameNode.text, node, node);
					}
				}
			}
		}

		return;
	}

	node.forEachChild(child => {
		visitComponentDefinitions(child, context);
	});
}
