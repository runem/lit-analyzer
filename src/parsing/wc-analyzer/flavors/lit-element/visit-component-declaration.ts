import { isAssignableToType, SimpleType, SimpleTypeKind, toSimpleType, toTypeString } from "ts-simple-type";
import { CallExpression, Node, ObjectLiteralExpression } from "typescript";
import { ParseVisitContext, ParseVisitContextComponentDeclaration } from "../parse-component-flavor";
import { isValidAttributeName } from "../../util/sanitize-attribute-name";
import { getRelevantSuperClassDeclarations, hasModifier, hasPublicSetter, isPropertyRequired } from "../../util/ast-util";

interface LitPropertyConfiguration {
	type?: SimpleType;
	attribute?: string | boolean;
	node?: {
		type?: Node;
		attribute?: Node;
	};
	hasConverter?: boolean;
}

export function visitComponentDeclaration(node: Node, context: ParseVisitContextComponentDeclaration): void {
	const { ts, checker } = context;

	// class Test extends LitElement implements MyBase
	if (ts.isInterfaceDeclaration(node) || ts.isClassLike(node)) {
		context.emitDeclarationNode(node, node.name && node.name.text);

		getRelevantSuperClassDeclarations(node, context).forEach(decl => {
			context.emitExtends(decl);
			visitComponentDeclaration(decl, {
				...context,
				emitDeclarationNode() {}
			});
		});
	}

	// static get properties() { return { myProp: {type: String} } }
	else if (ts.isGetAccessor(node) && hasModifier(node, ts.SyntaxKind.StaticKeyword)) {
		const name = node.name.getText();
		if (name === "properties" && node.body != null) {
			return visitStaticProperties(node.body, context);
		}
	}

	// @property({type: String}) myProp = "hello";
	else if ((ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) && hasPublicSetter(node, ts)) {
		const dec = getLitElementPropertyDecorator(node, context);

		if (dec != null) {
			const propName = node.name.getText();
			const configNode = dec.arguments[0];
			const config: LitPropertyConfiguration = configNode != null && ts.isObjectLiteralExpression(configNode) ? getLitPropertyOptions(configNode, context) : {};
			const propType = checker.getTypeAtLocation(node);
			const simplePropType = toSimpleType(propType, checker);

			const type = simplePropType.kind === SimpleTypeKind.ANY && config.type != null ? config.type : propType;

			if (config.attribute === false) {
				return;
			}

			if (config.type != null) {
				if (!isAssignableToType(config.type, simplePropType)) {
					context.emitDiagnostics({
						node: (config.node && config.node.type) || node,
						message: `@property type '${toTypeString(simplePropType)}' is not assignable to '${toTypeString(config.type)}'`,
						severity: "medium"
					});
				}
			}

			if (config.type == null && !config.hasConverter && simplePropType.kind !== SimpleTypeKind.ANY) {
				if (isAssignableToType({ kind: SimpleTypeKind.STRING }, simplePropType, checker)) {
					//logger.debug(node.name.getText(), `You need to add {type: STRING}`);
				} else if (isAssignableToType({ kind: SimpleTypeKind.NUMBER }, simplePropType, checker)) {
					context.emitDiagnostics({
						node,
						severity: "medium",
						message: `You need to add {type: NUMBER} to @property decorator for '${propName}''`
					});
				} else if (isAssignableToType({ kind: SimpleTypeKind.BOOLEAN }, simplePropType, checker)) {
					context.emitDiagnostics({
						node,
						severity: "medium",
						message: `You need to add {type: BOOLEAN} to @property decorator for '${propName}''`
					});
				} else if (
					isAssignableToType(
						{
							kind: SimpleTypeKind.ARRAY,
							type: { kind: SimpleTypeKind.ANY }
						},
						simplePropType,
						checker
					)
				) {
					context.emitDiagnostics({
						node,
						severity: "medium",
						message: `You need to add {type: ARRAY} to @property decorator for '${propName}''`
					});
				} else {
					context.emitDiagnostics({
						node,
						severity: "medium",
						message: `You need to add {type: OBJECT} to @property decorator for '${propName}''`
					});
				}
			}

			if (typeof config.attribute === "string") {
				if (!isValidAttributeName(config.attribute)) {
					context.emitDiagnostics({
						node,
						severity: "high",
						message: `Invalid attribute name '${config.attribute}'`
					});
				}
			}

			const attrName = typeof config.attribute === "string" ? config.attribute : propName;

			context.emitAttr({
				name: attrName,
				type,
				node,
				default: node.initializer && node.initializer.getText(),
				required: isPropertyRequired(node, context.checker)
			});
		}
	}

	node.forEachChild(child => {
		visitComponentDeclaration(child, context);
	});
}

function visitStaticProperties(node: Node, context: ParseVisitContextComponentDeclaration): void {
	const { ts } = context;

	if (ts.isReturnStatement(node)) {
		if (node.expression != null && ts.isObjectLiteralExpression(node.expression)) {
			for (const propNode of node.expression.properties) {
				const propName = propNode.name != null && ts.isIdentifier(propNode.name) ? propNode.name.text : undefined;
				const propConfig: LitPropertyConfiguration =
					ts.isPropertyAssignment(propNode) && ts.isObjectLiteralExpression(propNode.initializer) ? getLitPropertyOptions(propNode.initializer, context) : {};

				if (propName != null) {
					context.emitProp({
						name: propName,
						type: propConfig.type || { kind: SimpleTypeKind.ANY },
						node: propNode
					});
				}

				if (propConfig.attribute === false) continue;

				const attrName = typeof propConfig.attribute === "string" ? propConfig.attribute : propName;

				if (attrName != null) {
					context.emitAttr({
						name: attrName,
						type: propConfig.type || { kind: SimpleTypeKind.ANY },
						node: (propConfig.node != null && propConfig.node.attribute) || propNode
					});
				}
			}
		}
	}

	node.forEachChild(child => {
		visitStaticProperties(child, context);
	});
}

function getLitPropertyOptions(node: ObjectLiteralExpression, context: ParseVisitContext): LitPropertyConfiguration {
	const { ts } = context;

	const config: LitPropertyConfiguration = {};

	for (const property of node.properties) {
		if (!ts.isPropertyAssignment(property)) continue;

		const initializer = property.initializer;
		const name = ts.isIdentifier(property.name) ? property.name.text : undefined;

		switch (name) {
			case "converter": {
				config.hasConverter = true;
				break;
			}

			case "attribute": {
				if (initializer.kind === ts.SyntaxKind.TrueKeyword) {
					config.attribute = true;
				} else if (initializer.kind === ts.SyntaxKind.FalseKeyword) {
					config.attribute = false;
				} else if (ts.isStringLiteral(initializer)) {
					config.attribute = initializer.text;
				}

				config.node = {
					...(config.node || {}),
					attribute: property
				};

				break;
			}

			case "type": {
				const value = ts.isIdentifier(initializer) ? initializer.text : undefined;

				switch (value) {
					case "String":
						config.type = { kind: SimpleTypeKind.STRING };
						break;
					case "Number":
						config.type = { kind: SimpleTypeKind.NUMBER };
						break;
					case "Boolean":
						config.type = { kind: SimpleTypeKind.BOOLEAN };
						break;
					case "Array":
						config.type = { kind: SimpleTypeKind.ARRAY, type: { kind: SimpleTypeKind.ANY } };
						break;
					default:
						config.type = { kind: SimpleTypeKind.OBJECT, members: [] };
						break;
				}

				config.node = {
					...(config.node || {}),
					type: property
				};

				break;
			}
		}
	}

	return config;
}

function getLitElementPropertyDecorator(node: Node, context: ParseVisitContext): undefined | CallExpression {
	if (node.decorators == null) return undefined;
	const { ts } = context;

	const decorator = node.decorators.find(decorator => {
		const expression = decorator.expression;
		return ts.isCallExpression(expression) && ts.isIdentifier(expression.expression) && expression.expression.text === "property";
	});

	return decorator != null && ts.isCallExpression(decorator.expression) ? decorator.expression : undefined;
}
