import { SimpleType, SimpleTypeKind, toSimpleType } from "ts-simple-type";
import { Node } from "typescript";
import { ParseVisitContextComponentDeclaration } from "../../parse-component-flavor";
import { getGeneralType, getRelevantSuperClassDeclarations, hasFlag, hasModifier, hasPublicSetter, isPropertyRequired } from "../../util";

export function visitComponentDeclaration(node: Node, context: ParseVisitContextComponentDeclaration): void {
	const { ts, checker } = context;

	// class Test extends LitElement implements MyBase
	if (ts.isInterfaceDeclaration(node) || ts.isClassLike(node)) {
		if (node.name != null) {
			context.emitClassName(node.name.text);
		}

		getRelevantSuperClassDeclarations(node, context).forEach(decl => {
			context.emitExtends(decl);
			visitComponentDeclaration(decl, {
				...context,
				emitClassName() {}
			});
		});
	}

	// static get observedAttributes() { return ['c', 'l']; }
	if (ts.isGetAccessor(node) && hasModifier(node, ts.SyntaxKind.StaticKeyword)) {
		const name = node.name.getText();
		if (name === "observedAttributes" && node.body != null) {
			return visitObservedAttributes(node.body, context);
		}
	}

	// class { myProp = "hello"; }
	else if ((ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) && hasPublicSetter(node, ts)) {
		const { name, initializer } = node;
		if (ts.isIdentifier(name)) {
			context.emitProp({
				name: name.text,
				type: checker.getTypeAtLocation(node),
				required: isPropertyRequired(node, context.checker),
				default: initializer && initializer.getText(),
				node
			});
		}
	}

	// class { set myProp(value: string) { ... } }
	else if (ts.isSetAccessor(node) && hasPublicSetter(node, ts)) {
		const { name, parameters } = node;
		if (ts.isIdentifier(name) && parameters.length > 0) {
			const parameter = parameters[0];

			context.emitProp({
				name: name.text,
				type: context.checker.getTypeAtLocation(parameter),
				required: false,
				node
			});
		}
	}

	// constructor () {
	//    super();
	//    this.myProp = "hello";
	// }
	parseThisAssignment(node, context);

	node.forEachChild(child => {
		visitComponentDeclaration(child, context);
	});
}

function parseThisAssignment(node: Node, context: ParseVisitContextComponentDeclaration): void {
	const { ts, checker } = context;

	if (ts.isBinaryExpression(node)) {
		if (ts.isPropertyAccessExpression(node.left)) {
			const { expression, name } = node.left;
			if (hasFlag(expression.kind, ts.SyntaxKind.ThisKeyword) && ts.isIdentifier(name)) {
				const simpleType = toSimpleType(context.checker.getTypeAtLocation(node.right), checker);
				const generalType: SimpleType = getGeneralType(simpleType);

				context.emitProp({
					name: name.text,
					type: generalType,
					node
				});
			}
		}
	}
}

function visitObservedAttributes(node: Node, context: ParseVisitContextComponentDeclaration): void {
	const { ts } = context;

	if (ts.isReturnStatement(node)) {
		if (node.expression != null && ts.isArrayLiteralExpression(node.expression)) {
			for (const attrNameNode of node.expression.elements) {
				const attrName = ts.isStringLiteralLike(attrNameNode) ? attrNameNode.text : undefined;
				if (attrName == null) continue;

				context.emitAttr({
					name: attrName,
					type: { kind: SimpleTypeKind.ANY },
					node: attrNameNode
				});
			}
		}
	}

	node.forEachChild(child => {
		visitObservedAttributes(child, context);
	});
}
