import { isAssignableToSimpleTypeKind, SimpleTypeKind } from "ts-simple-type";
import { ClassLikeDeclaration, InterfaceDeclaration, Node, PropertyDeclaration } from "typescript";
import { IComponentDeclarationJsDoc, IComponentDeclarationJsDocTag, IComponentDeclarationMeta, IComponentDeclarationProp } from "../component-types";
import { IComponentDeclarationVisitContext, IComponentDefinitionVisitContext, IParseComponentFlavor } from "../parse-components";

/**
 * A class that implements lit-element related parsing functionality.
 */
export class LitElementFlavor implements IParseComponentFlavor {
	/**
	 * Visits lit-element related custom-element definitions.
	 * @param node
	 * @param context
	 */
	visitComponentDefinitions(node: Node, context: IComponentDefinitionVisitContext): void {
		const { ts, checker } = context;

		// Handle "declare global { interface HTMLElementTagNameMap { "my-button": MyButton; } }"
		if (ts.isModuleBlock(node)) {
			for (const statement of node.statements) {
				if (ts.isInterfaceDeclaration(statement)) {
					if (statement.name.text === "HTMLElementTagNameMap") {
						for (const member of (statement as InterfaceDeclaration).members) {
							if (ts.isPropertySignature(member) && ts.isStringLiteral(member.name) && member.type != null && ts.isTypeReferenceNode(member.type)) {
								const tagName = member.name.text;
								const typeName = member.type.typeName;

								const symbol = checker.getSymbolAtLocation(typeName);

								if (symbol != null) {
									const declaration = symbol.valueDeclaration || context.checker.getAliasedSymbol(symbol).valueDeclaration;

									context.addComponentDefinition(tagName, declaration);
								}
							}
						}
					}
				}
			}
		}

		// Check "@customElement("my-element")"
		if (ts.isClassDeclaration(node)) {
			for (const decorator of node.decorators || []) {
				const callExpression = decorator.expression;
				if (ts.isCallExpression(callExpression) && ts.isIdentifier(callExpression.expression)) {
					const decoratorIdentifierName = callExpression.expression.escapedText;
					if (decoratorIdentifierName === "customElement") {
						const find = (node: Node | undefined): Node | undefined => {
							if (!node) return;
							if (ts.isStringLiteral(node)) return node;
							return node.forEachChild(child => find(child));
						};

						const tagNameNode = find(callExpression.arguments[0]);

						if (tagNameNode != null && ts.isStringLiteralLike(tagNameNode)) {
							context.addComponentDefinition(tagNameNode.text, node);
						}
					}
				}
			}

			// Don't visit the class, we don't have definitions inside of it
			return;
		}

		node.forEachChild(child => {
			this.visitComponentDefinitions(child, context);
		});
	}

	/**
	 * Visits lit-element related component declaration.
	 * @param node
	 * @param context
	 */
	visitComponentDeclaration(node: Node, context: IComponentDeclarationVisitContext): void {
		if (context.ts.isClassLike(node)) {
			const thisJsDoc = visitJsDoc(node, context) || {};
			const superJsDocTags = this.visitSuperClass(node, context);

			// Emit metadata and merge possible super class js docs
			const meta: IComponentDeclarationMeta = {
				className: node.name != null ? String(node.name.escapedText) : undefined,
				jsDoc: {
					...thisJsDoc,
					tags: [...(thisJsDoc.tags || []), ...superJsDocTags]
				}
			};

			context.addMeta(meta);
		} else if (context.ts.isPropertyDeclaration(node)) {
			const propInfo = parsePropertyDeclaration(node, context);
			if (propInfo != null) {
				context.addProp(propInfo);
			}
		}

		node.forEachChild(child => {
			this.visitComponentDeclaration(child, context);
		});
	}

	/**
	 * Visits a potential super class.
	 * @param node
	 * @param context
	 */
	private visitSuperClass(node: ClassLikeDeclaration, context: IComponentDeclarationVisitContext): IComponentDeclarationJsDocTag[] {
		const superJsDocTags: IComponentDeclarationJsDocTag[] = [];
		if (node.heritageClauses != null) {
			for (const heritage of node.heritageClauses) {
				if (heritage.token !== context.ts.SyntaxKind.ExtendsKeyword) continue;

				for (const type of heritage.types) {
					// Find the super class symbol
					const symbol = context.checker.getSymbolAtLocation(type.expression);

					if (symbol != null) {
						// Find the declaration of the super class symbol
						const declaration = symbol.valueDeclaration || context.checker.getAliasedSymbol(symbol).valueDeclaration;

						// Parse the super class
						this.visitComponentDeclaration(declaration, {
							...context,
							addMeta(meta: IComponentDeclarationMeta): void {
								superJsDocTags.push(...(meta.jsDoc && meta.jsDoc.tags ? meta.jsDoc.tags : []));
							}
						});
					}
				}
			}
		}

		return superJsDocTags;
	}
}

/**
 * Parses a property declaration.
 * @param node
 * @param context
 */
function parsePropertyDeclaration(node: PropertyDeclaration, context: IComponentDeclarationVisitContext): IComponentDeclarationProp | undefined {
	const decoratorIdentifier = (() =>
		(node.decorators || []).find(decorator => {
			const expression = decorator.expression;
			return context.ts.isCallExpression(expression) && context.ts.isIdentifier(expression.expression) && expression.expression.getText() === "property";
		}))();

	const fromExternalModule = context.ts.isExternalModule(node.getSourceFile());

	// It's okay if we can't find a @property decorator in a library file because they aren't shipped with type declarations.
	if (decoratorIdentifier == null && !fromExternalModule) {
		return;
	}

	const name = String(node.name.getText());

	if (node.modifiers != null) {
		const ignoreModifierKinds = [
			context.ts.SyntaxKind.PrivateKeyword,
			context.ts.SyntaxKind.ProtectedKeyword,
			context.ts.SyntaxKind.ReadonlyKeyword,
			context.ts.SyntaxKind.StaticKeyword,
			context.ts.SyntaxKind.StaticKeyword
		];
		const hasIgnoredModifier = node.modifiers.find(m => ignoreModifierKinds.includes(m.kind));
		if (hasIgnoredModifier) return;
	}

	const type = context.checker.getTypeAtLocation(node);

	const defaultValue = (() => {
		if (node.initializer == null) return undefined;
		if (context.ts.isStringLiteral(node.initializer) || context.ts.isNumericLiteral(node.initializer)) {
			return node.initializer.getText();
		}
	})();

	// Properties in external modules don't have initializers, so we cannot infer if the property is required or not
	const required = fromExternalModule ? false : node.initializer == null && !isAssignableToSimpleTypeKind(type, [SimpleTypeKind.UNDEFINED, SimpleTypeKind.NULL], context.checker, { op: "or" });

	return {
		type,
		required,
		name,
		default: defaultValue,
		jsDoc: visitJsDoc(node, context),
		location: {
			start: node.getStart(),
			end: node.getEnd()
		}
	};
}

/**
 * Parse jsdoc nodes.
 * @param node
 * @param context
 */
function visitJsDoc(node: Node, context: IComponentDeclarationVisitContext): IComponentDeclarationJsDoc | undefined {
	const docs = ((node as any).jsDoc as any[]) || [];
	for (const doc of docs) {
		if (context.ts.isJSDoc(doc)) {
			return {
				comment: doc.comment == null ? undefined : String(doc.comment),
				tags:
					doc.tags == null
						? []
						: doc.tags.map(tag => ({
								tag: String(tag.tagName.escapedText),
								comment: tag.comment == null ? undefined : String(tag.comment)
						  }))
			};
		}
	}
}
