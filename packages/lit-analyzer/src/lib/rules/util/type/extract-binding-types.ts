import {
	isSimpleType,
	SimpleType,
	SimpleTypeBooleanLiteral,
	SimpleTypeEnumMember,
	SimpleTypeString,
	SimpleTypeStringLiteral,
	toSimpleType
} from "ts-simple-type";
import { Expression, Type, TypeChecker } from "typescript";
import { HtmlNodeAttrAssignment, HtmlNodeAttrAssignmentKind } from "../../../analyze/types/html-node/html-node-attr-assignment-types.js";
import { HtmlNodeAttrKind } from "../../../analyze/types/html-node/html-node-attr-types.js";
import { RuleModuleContext } from "../../../analyze/types/rule/rule-module-context.js";
import { getDirective } from "../directive/get-directive.js";

const cache = new WeakMap<HtmlNodeAttrAssignment, { typeA: SimpleType; typeB: SimpleType }>();

export function extractBindingTypes(assignment: HtmlNodeAttrAssignment, context: RuleModuleContext): { typeA: SimpleType; typeB: SimpleType } {
	if (cache.has(assignment)) {
		return cache.get(assignment)!;
	}

	const checker = context.program.getTypeChecker();

	// Relax the type we are looking at an expression in javascript files
	//const inJavascriptFile = request.file.fileName.endsWith(".js");
	//const shouldRelaxTypeB = 1 !== 1 && inJavascriptFile && assignment.kind === HtmlNodeAttrAssignmentKind.EXPRESSION;
	const shouldRelaxTypeB = false; // Disable for now while collecting requirements

	// Infer the type of the RHS
	//const typeBInferred = shouldRelaxTypeB ? ({ kind: "ANY" } as SimpleType) : inferTypeFromAssignment(assignment, checker);
	const typeBInferred = inferTypeFromAssignment(assignment, checker);

	// Convert typeB to SimpleType
	let typeB = (() => {
		const type = isSimpleType(typeBInferred) ? typeBInferred : toSimpleType(typeBInferred, checker);
		return shouldRelaxTypeB ? relaxType(type) : type;
	})();

	// Find a corresponding target for this attribute
	const htmlAttrTarget = context.htmlStore.getHtmlAttrTarget(assignment.htmlAttr);
	//if (htmlAttrTarget == null) return [];

	const typeA = htmlAttrTarget == null ? ({ kind: "ANY" } as SimpleType) : htmlAttrTarget.getType();

	// Handle directives
	const directive = getDirective(assignment, context);
	const directiveType = directive?.actualType?.();
	if (directiveType != null) {
		typeB = directiveType;
	}

	// Handle `nothing` and `noChange` symbols
	// Since it's not possible to check the details of a symbol due to various restrictions (it's treated as a `unique symbol` or `Symbol()`), all symbols are excluded.
	typeB = excludeSymbolsFromUnion(typeB);

	// Cache the result
	const result = { typeA, typeB };
	cache.set(assignment, result);

	return result;
}

export function inferTypeFromAssignment(assignment: HtmlNodeAttrAssignment, checker: TypeChecker): SimpleType | Type {
	switch (assignment.kind) {
		case HtmlNodeAttrAssignmentKind.STRING:
			return { kind: "STRING_LITERAL", value: assignment.value } as SimpleTypeStringLiteral;
		case HtmlNodeAttrAssignmentKind.BOOLEAN:
			return { kind: "BOOLEAN_LITERAL", value: true } as SimpleTypeBooleanLiteral;
		case HtmlNodeAttrAssignmentKind.ELEMENT_EXPRESSION:
			return checker.getTypeAtLocation(assignment.expression);
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

			return { kind: "STRING" } as SimpleTypeString;
	}
}

function excludeSymbolsFromUnion(type: SimpleType): SimpleType {
	if (type.kind !== "UNION") {
		return type;
	}

	return {
		...type,
		types: type.types.filter(t => t.kind !== "ES_SYMBOL" && t.kind !== "ES_SYMBOL_UNIQUE")
	};
}

/**
 * Relax the type so that for example "string literal" become "string" and "function" become "any"
 * This is used for javascript files to provide type checking with Typescript type inferring
 * @param type
 */
export function relaxType(type: SimpleType): SimpleType {
	switch (type.kind) {
		case "INTERSECTION":
		case "UNION":
			return {
				...type,
				types: type.types.map(t => relaxType(t))
			};

		case "ENUM":
			return {
				...type,
				types: type.types.map(t => relaxType(t) as SimpleTypeEnumMember)
			};

		case "ARRAY":
			return {
				...type,
				type: relaxType(type.type)
			};

		case "PROMISE":
			return {
				...type,
				type: relaxType(type.type)
			};

		case "INTERFACE":
		case "OBJECT":
		case "FUNCTION":
		case "CLASS":
			return {
				kind: "ANY"
			};

		case "NUMBER_LITERAL":
			return { kind: "NUMBER" };
		case "STRING_LITERAL":
			return { kind: "STRING" };
		case "BOOLEAN_LITERAL":
			return { kind: "BOOLEAN" };
		case "BIG_INT_LITERAL":
			return { kind: "BIG_INT" };

		case "ENUM_MEMBER":
			return {
				...type,
				type: relaxType(type.type)
			} as SimpleTypeEnumMember;

		case "ALIAS":
			return {
				...type,
				target: relaxType(type.target)
			};

		default:
			return type;
	}
}
