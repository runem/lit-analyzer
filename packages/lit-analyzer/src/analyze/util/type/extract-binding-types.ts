import {
	isSimpleType,
	SimpleType,
	SimpleTypeBooleanLiteral,
	SimpleTypeEnumMember,
	SimpleTypeKind,
	SimpleTypeString,
	SimpleTypeStringLiteral,
	toSimpleType
} from "ts-simple-type";
import { Type, TypeChecker, Expression } from "typescript";
import { LitAnalyzerRequest } from "../../lit-analyzer-context";
import { HtmlNodeAttrAssignment, HtmlNodeAttrAssignmentKind } from "../../types/html-node/html-node-attr-assignment-types";
import { HtmlNodeAttrKind } from "../../types/html-node/html-node-attr-types";
import { getDirective } from "../directive/get-directive";

const cache = new WeakMap<HtmlNodeAttrAssignment, { typeA: SimpleType; typeB: SimpleType }>();

export function extractBindingTypes(assignment: HtmlNodeAttrAssignment, request: LitAnalyzerRequest): { typeA: SimpleType; typeB: SimpleType } {
	if (cache.has(assignment)) {
		return cache.get(assignment)!;
	}

	const checker = request.program.getTypeChecker();

	// Relax the type we are looking at an expression in javascript files
	//const inJavascriptFile = request.file.fileName.endsWith(".js");
	//const shouldRelaxTypeB = 1 !== 1 && inJavascriptFile && assignment.kind === HtmlNodeAttrAssignmentKind.EXPRESSION;
	const shouldRelaxTypeB = false; // Disable for now while collecting requirements

	// Infer the type of the RHS
	//const typeBInferred = shouldRelaxTypeB ? ({ kind: SimpleTypeKind.ANY } as SimpleType) : inferTypeFromAssignment(assignment, checker);
	const typeBInferred = inferTypeFromAssignment(assignment, checker);

	// Convert typeB to SimpleType
	let typeB = (() => {
		const type = isSimpleType(typeBInferred) ? typeBInferred : toSimpleType(typeBInferred, checker);
		return shouldRelaxTypeB ? relaxType(type) : type;
	})();

	// Find a corresponding target for this attribute
	const htmlAttrTarget = request.htmlStore.getHtmlAttrTarget(assignment.htmlAttr);
	//if (htmlAttrTarget == null) return [];

	const typeA = htmlAttrTarget == null ? ({ kind: SimpleTypeKind.ANY } as SimpleType) : htmlAttrTarget.getType();

	// Handle directives
	const directive = getDirective(assignment, request);
	if (directive != null && directive.actualType != null) {
		typeB = directive.actualType;
	}

	// Cache the result
	const result = { typeA, typeB };
	cache.set(assignment, result);

	return result;
}

export function inferTypeFromAssignment(assignment: HtmlNodeAttrAssignment, checker: TypeChecker): SimpleType | Type {
	switch (assignment.kind) {
		case HtmlNodeAttrAssignmentKind.STRING:
			return { kind: SimpleTypeKind.STRING_LITERAL, value: assignment.value } as SimpleTypeStringLiteral;
		case HtmlNodeAttrAssignmentKind.BOOLEAN:
			return { kind: SimpleTypeKind.BOOLEAN_LITERAL, value: true } as SimpleTypeBooleanLiteral;
		case HtmlNodeAttrAssignmentKind.EXPRESSION:
			return checker.getTypeAtLocation(assignment.expression);
		case HtmlNodeAttrAssignmentKind.MIXED:
			// Event bindings always looks at the first expression
			// Therefore, return the type of the first expression
			if (assignment.htmlAttr.kind === HtmlNodeAttrKind.EVENT_LISTENER) {
				const expression = assignment.values.find((val): val is Expression => typeof val !== "string");

				if (expression != null) {
					return checker.getTypeAtLocation(expression);
				}
			}

			return { kind: SimpleTypeKind.STRING } as SimpleTypeString;
	}
}

/**
 * Relax the type so that for example "string literal" become "string" and "function" become "any"
 * This is used for javascript files to provide type checking with Typescript type inferring
 * @param type
 */
export function relaxType(type: SimpleType): SimpleType {
	switch (type.kind) {
		case SimpleTypeKind.INTERSECTION:
		case SimpleTypeKind.UNION:
			return {
				...type,
				types: type.types.map(t => relaxType(t))
			};

		case SimpleTypeKind.ENUM:
			return {
				...type,
				types: type.types.map(t => relaxType(t) as SimpleTypeEnumMember)
			};

		case SimpleTypeKind.ARRAY:
			return {
				...type,
				type: relaxType(type.type)
			};

		case SimpleTypeKind.PROMISE:
			return {
				...type,
				type: relaxType(type.type)
			};

		case SimpleTypeKind.INTERFACE:
		case SimpleTypeKind.OBJECT:
		case SimpleTypeKind.FUNCTION:
		case SimpleTypeKind.CLASS:
			return {
				kind: SimpleTypeKind.ANY
			};

		case SimpleTypeKind.NUMBER_LITERAL:
			return { kind: SimpleTypeKind.NUMBER };
		case SimpleTypeKind.STRING_LITERAL:
			return { kind: SimpleTypeKind.STRING };
		case SimpleTypeKind.BOOLEAN_LITERAL:
			return { kind: SimpleTypeKind.BOOLEAN };
		case SimpleTypeKind.BIG_INT_LITERAL:
			return { kind: SimpleTypeKind.BIG_INT };

		case SimpleTypeKind.ENUM_MEMBER:
			return {
				...type,
				type: relaxType(type.type)
			} as SimpleTypeEnumMember;

		case SimpleTypeKind.ALIAS:
			return {
				...type,
				target: relaxType(type.target)
			};

		default:
			return type;
	}
}
