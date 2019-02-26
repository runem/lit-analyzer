import { ParseVisitContextComponentDefinition } from "../parse-component-flavor";
import { getDeclaration, getExtendedModuleInterfaceKeys } from "../../util/ast-util";
import { Node } from "typescript";

export function visitComponentDefinitions(node: Node, context: ParseVisitContextComponentDefinition) {
	const { checker, ts } = context;

	// customElement.define("my-element", MyElement)
	if (ts.isCallExpression(node)) {
		if (ts.isPropertyAccessExpression(node.expression)) {
			if (node.expression.name != null && ts.isIdentifier(node.expression.name)) {
				// define("my-element", MyElement)
				if (node.expression.name.escapedText === "define") {
					const [tagNameNode, identifierNode] = node.arguments;

					// ("my-element", MyElement)
					if (identifierNode != null && tagNameNode != null && ts.isStringLiteralLike(tagNameNode)) {
						// (___, MyElement)
						if (ts.isIdentifier(identifierNode)) {
							const symbol = checker.getSymbolAtLocation(identifierNode);

							if (symbol != null) {
								const declaration = getDeclaration(symbol, checker);

								if (declaration != null) {
									context.emitDefinition(tagNameNode.text, node, declaration);
								}
							}
						}

						// (___, class { ... })
						else if (ts.isClassLike(identifierNode)) {
							context.emitDefinition(tagNameNode.text, node, identifierNode);
						}
					}
				}
			}
		}

		return;
	}

	// declare global { interface HTMLElementTagNameMap { "my-button": MyButton; } }
	if (ts.isModuleBlock(node)) {
		const extensions = getExtendedModuleInterfaceKeys(node, "HTMLElementTagNameMap", context);
		for (const [tagName, declaration] of extensions) {
			context.emitDefinition(tagName, node, declaration);
		}

		return;
	}

	node.forEachChild(child => {
		visitComponentDefinitions(child, context);
	});
}
