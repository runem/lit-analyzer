import { Node } from "typescript";
import { IComponentDeclarationVisitContext, IComponentDefinitionVisitContext, IParseComponentFlavor } from "../parse-components";

/**
 * Flavor that can parse custom elements.
 */
export class CustomElementFlavor implements IParseComponentFlavor {
	/**
	 * Parses custom element definitions from a node.
	 * @param node
	 * @param context
	 */
	visitComponentDefinitions(node: Node, context: IComponentDefinitionVisitContext): void {
		const { checker } = context;

		if (context.ts.isCallExpression(node)) {
			// Check "customElemen.define("my-element", MyElement)"
			if (context.ts.isPropertyAccessExpression(node.expression)) {
				if (node.expression.name != null && context.ts.isIdentifier(node.expression.name)) {
					if (node.expression.name.escapedText === "define") {
						const [tagNameNode, identifierNode] = node.arguments;
						if (context.ts.isStringLiteralLike(tagNameNode)) {
							if (context.ts.isIdentifier(identifierNode)) {
								const symbol = checker.getSymbolAtLocation(identifierNode);
								if (symbol != null) {
									const declaration = symbol.valueDeclaration || checker.getAliasedSymbol(symbol).valueDeclaration;

									if (context.ts.isClassLike(declaration)) {
										context.addComponentDefinition(tagNameNode.text, declaration);
									}
								}
							} else if (context.ts.isClassLike(identifierNode)) {
								context.addComponentDefinition(tagNameNode.text, identifierNode);
							}
						}
					}
				}
			}
		}

		node.forEachChild(child => {
			this.visitComponentDefinitions(child, context);
		});
	}

	/**
	 * Visit a custom element declaration.
	 * @param node
	 * @param context
	 */
	visitComponentDeclaration(node: Node, context: IComponentDeclarationVisitContext): void {
		// TODO: Handle raw custom elements.
	}
}
