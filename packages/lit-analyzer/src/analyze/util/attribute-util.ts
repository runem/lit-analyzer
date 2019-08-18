import {
	isSimpleType,
	SimpleType,
	SimpleTypeBooleanLiteral,
	SimpleTypeKind,
	SimpleTypeString,
	SimpleTypeStringLiteral,
	toSimpleType
} from "ts-simple-type";
import { Type, TypeChecker } from "typescript";
import { HtmlNodeAttr } from "../types/html-node/html-node-attr-types";
import { HtmlNodeAttrAssignment, HtmlNodeAttrAssignmentKind } from "../types/html-node/html-node-attr-assignment-types";
import { LitAnalyzerRequest } from "../lit-analyzer-context";
import { relaxType, removeUndefinedFromType, isLitDirective } from "./type-util";

export function inferTypeFromAssignment(assignment: HtmlNodeAttrAssignment, checker: TypeChecker): SimpleType | Type {
	switch (assignment.kind) {
		case HtmlNodeAttrAssignmentKind.STRING:
			return { kind: SimpleTypeKind.STRING_LITERAL, value: assignment.value } as SimpleTypeStringLiteral;
		case HtmlNodeAttrAssignmentKind.BOOLEAN:
			return { kind: SimpleTypeKind.BOOLEAN_LITERAL, value: true } as SimpleTypeBooleanLiteral;
		case HtmlNodeAttrAssignmentKind.EXPRESSION:
			return checker.getTypeAtLocation(assignment.expression);
		case HtmlNodeAttrAssignmentKind.MIXED:
			return { kind: SimpleTypeKind.STRING } as SimpleTypeString;
	}
}

export function extractAttributeTypes(context: LitAnalyzerRequest, node: HtmlNodeAttr): { typeA: SimpleType; typeB: SimpleType } | undefined {
	if (node.assignment === undefined) {
		return undefined;
	}

	const htmlAttrTarget = context.htmlStore.getHtmlAttrTarget(node);

	if (!htmlAttrTarget) {
		return undefined;
	}

	const { ts } = context;

	// Relax the type we are looking at an expression in javascript files
	const inJavascriptFile = context.file.fileName.endsWith(".js");
	const shouldRelaxTypeB = 1 !== 1 && inJavascriptFile && node.assignment.kind === HtmlNodeAttrAssignmentKind.EXPRESSION;
	const checker = context.program.getTypeChecker();

	// Infer the type of the RHS
	const typeBInferred = inferTypeFromAssignment(node.assignment, checker);

	// Convert typeB to SimpleType
	const type = isSimpleType(typeBInferred) ? typeBInferred : toSimpleType(typeBInferred, checker);
	let typeB = shouldRelaxTypeB ? relaxType(type) : type;

	if (isLitDirective(typeB) && node.assignment.kind === HtmlNodeAttrAssignmentKind.EXPRESSION && ts.isCallExpression(node.assignment.expression)) {
		const functionName = node.assignment.expression.expression.getText();
		const args = Array.from(node.assignment.expression.arguments);

		if (functionName === "ifDefined" && args.length === 1) {
			const returnType = toSimpleType(checker.getTypeAtLocation(args[0]), checker);
			const returnTypeWithoutUndefined = removeUndefinedFromType(returnType);
			typeB = returnTypeWithoutUndefined;
		} else if (functionName === "guard" && args.length === 2) {
			const returnFunctionType = toSimpleType(checker.getTypeAtLocation(args[1]), checker);

			if (returnFunctionType.kind === SimpleTypeKind.FUNCTION) {
				const returnType = returnFunctionType.returnType;

				if (returnType != null) {
					typeB = returnType;
				}
			}
		}
	}

	return {
		typeA: htmlAttrTarget.getType(),
		typeB
	};
}
