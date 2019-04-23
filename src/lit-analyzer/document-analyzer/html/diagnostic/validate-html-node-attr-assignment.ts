import {
	isAssignableToPrimitiveType,
	isAssignableToSimpleTypeKind,
	isAssignableToType,
	isSimpleType,
	SimpleType,
	SimpleTypeBooleanLiteral,
	SimpleTypeKind,
	SimpleTypeString,
	SimpleTypeStringLiteral,
	simpleTypeToString,
	toSimpleType,
	toTypeString
} from "ts-simple-type";
import { Type, TypeChecker } from "typescript";
import { LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER, LIT_HTML_PROP_ATTRIBUTE_MODIFIER } from "../../../../constants";
import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { HtmlNodeAttrAssignment, HtmlNodeAttrAssignmentKind } from "../../../types/html-node/html-node-attr-assignment-types";
import { HtmlNodeAttr, HtmlNodeAttrKind } from "../../../types/html-node/html-node-attr-types";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../../../types/lit-diagnostic";

/**
 * Validates an attribute assignment: lit-html style.
 * @param htmlAttr
 * @param request
 */
export function validateHtmlAttrAssignment(htmlAttr: HtmlNodeAttr, request: LitAnalyzerRequest): LitHtmlDiagnostic[] {
	const { htmlStore, config, program } = request;

	if (config.skipTypeChecking) return [];

	const { assignment } = htmlAttr;
	if (assignment == null) return [];

	const checker = program.getTypeChecker();

	// ==========================================
	// Let's start by validating the RHS (typeB)
	// ==========================================

	// Infer the type of the RHS
	const typeBInferred = inferTypeFromAssignment(assignment, checker);

	// Convert typeB to SimpleType
	const typeB = isSimpleType(typeBInferred) ? typeBInferred : toSimpleType(typeBInferred, checker);

	// Validate lit assignment rules
	const rulesResult = validateHtmlAttrAssignmentRules(htmlAttr, typeB, request);
	if (rulesResult != null) return rulesResult;

	// Validate slot attribute assignments
	const slotResult = validateHtmlAttrSlotAssignment(htmlAttr, request);
	if (slotResult != null) return slotResult;

	// Find a corresponding target for this attribute
	const htmlAttrTarget = htmlStore.getHtmlAttrTarget(htmlAttr);
	if (htmlAttrTarget == null) return [];

	// ==========================================
	// Now, let's validate the assignment
	//  LHS === RHS (typeA === typeB)
	// ==========================================
	const typeA = htmlAttrTarget.getType();

	// Validate lit-html directives
	const directiveResult = validateHtmlAttrDirectiveAssignment(htmlAttr, { typeA, typeB }, request);
	if (directiveResult != null) return directiveResult;

	// Validate the types of the assignment
	const typesResult = validateHtmlAttrAssignmentTypes(htmlAttr, { typeA, typeB }, request);
	if (typesResult != null) return typesResult;

	return [];
}

function inferTypeFromAssignment(assignment: HtmlNodeAttrAssignment, checker: TypeChecker): SimpleType | Type {
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

function validateHtmlAttrAssignmentRules(htmlAttr: HtmlNodeAttr, typeB: SimpleType, { document, htmlStore, config, program }: LitAnalyzerRequest): LitHtmlDiagnostic[] | undefined {
	const { assignment } = htmlAttr;
	if (assignment == null) return undefined;

	switch (htmlAttr.kind) {
		case HtmlNodeAttrKind.EVENT_LISTENER:
			// Make sure that there is a function as event listener value.
			// Here we catch errors like: @click="onClick()"
			if (!isAssignableToSimpleTypeKind(typeB, SimpleTypeKind.FUNCTION) && !isAssignableToSimpleTypeKind(typeB, SimpleTypeKind.METHOD)) {
				return [
					{
						kind: LitHtmlDiagnosticKind.NO_EVENT_LISTENER_FUNCTION,
						message: `You are setting up an event listener with a non-callable type '${toTypeString(typeB)}'`,
						severity: "error",
						location: { document, ...htmlAttr.location.name },
						typeB
					}
				];
			}

			return [];

		// Check if we have a property assignment without a corresponding expression as value
		case HtmlNodeAttrKind.PROPERTY:
			switch (assignment.kind) {
				case HtmlNodeAttrAssignmentKind.STRING:
				case HtmlNodeAttrAssignmentKind.BOOLEAN:
					return [
						{
							kind: LitHtmlDiagnosticKind.PROPERTY_NEEDS_EXPRESSION,
							message: `You are using the property modifier without an expression`,
							severity: "error",
							location: { document, ...htmlAttr.location.name }
						}
					];
			}
			break;
	}
}

function validateHtmlAttrSlotAssignment(htmlAttr: HtmlNodeAttr, { document, htmlStore, config, program }: LitAnalyzerRequest): LitHtmlDiagnostic[] | undefined {
	const { assignment } = htmlAttr;

	if (htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE || assignment == null || assignment.kind !== HtmlNodeAttrAssignmentKind.STRING) return undefined;

	// Check for slots
	if (htmlAttr.name === "slot" && !config.skipUnknownSlots) {
		const parent = htmlAttr.htmlNode.parent;
		if (parent != null) {
			const parentHtmlTag = htmlStore.getHtmlTag(parent.tagName);

			if (parentHtmlTag != null && parentHtmlTag.slots.length > 0) {
				const slotName = assignment.value;
				const slots = Array.from(htmlStore.getAllSlotsForTag(parentHtmlTag.tagName));
				const matchingSlot = slots.find(slot => slot.name === slotName);

				if (matchingSlot == null) {
					const validSlotNames = slots.map(s => s.name);
					const message =
						validSlotNames.length === 1 && validSlotNames[0].length === 0
							? `Invalid slot name '${slotName}'. Only the unnamed slot is valid for <${parentHtmlTag.tagName}>`
							: `Invalid slot name '${slotName}'. Valid slot names for <${parentHtmlTag.tagName}> are: ${validSlotNames.map(n => `'${n}'`).join(" | ")}`;

					return [
						{
							kind: LitHtmlDiagnosticKind.INVALID_SLOT_NAME,
							message,
							validSlotNames,
							severity: "error",
							location: { document, ...htmlAttr.location.name }
						}
					];
				}
			}
		}
	}

	return undefined;
}

function validateHtmlAttrAssignmentTypes(
	htmlAttr: HtmlNodeAttr,
	{ typeA, typeB }: { typeA: SimpleType; typeB: SimpleType },
	{ program, document }: LitAnalyzerRequest
): LitHtmlDiagnostic[] | undefined {
	const { assignment } = htmlAttr;
	if (assignment == null) return undefined;

	const checker = program.getTypeChecker();

	switch (htmlAttr.modifier) {
		case LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER:
			// Test if the user is trying to use the ? modifier on a non-boolean type.
			if (!isAssignableToType(typeA, { kind: SimpleTypeKind.BOOLEAN })) {
				return [
					{
						kind: LitHtmlDiagnosticKind.BOOL_MOD_ON_NON_BOOL,
						message: `You are using a boolean attribute modifier on a non boolean type '${toTypeString(typeA)}'`,
						severity: "error",
						location: { document, ...htmlAttr.location.name },
						htmlAttr,
						typeA,
						typeB
					}
				];
			}
			break;

		case LIT_HTML_PROP_ATTRIBUTE_MODIFIER:
			break;

		default:
			// In this case there is no modifier. Therefore:

			// Only primitive types should be allowed as "typeB" and "typeA".
			if (!isAssignableToPrimitiveType(typeA)) {
				const message = (() => {
					if (assignment != null) {
						if (assignment.kind === HtmlNodeAttrAssignmentKind.BOOLEAN) {
							return `You are assigning a boolean to a non-primitive type '${toTypeString(typeA)}'. Use '.' modifier instead?`;
						} else if (assignment.kind === HtmlNodeAttrAssignmentKind.STRING && assignment.value.length > 0) {
							return `You are assigning the string '${toTypeString(typeB)}' to a non-primitive type '${toTypeString(typeA)}'. Use '.' modifier instead?`;
						}
					}
					return `You are assigning the primitive '${toTypeString(typeB)}' to a non-primitive type '${toTypeString(typeA)}'. Use '.' modifier instead?`;
				})();

				// Fail if the user is trying to assign a primitive value to a complex value.
				return [
					{
						kind: LitHtmlDiagnosticKind.PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX,
						severity: "error",
						message,
						location: { document, ...htmlAttr.location.name },
						htmlAttr,
						typeA,
						typeB
					}
				];
			} else if (!isAssignableToPrimitiveType(typeB)) {
				return [
					{
						kind: LitHtmlDiagnosticKind.COMPLEX_NOT_ASSIGNABLE_TO_PRIMITIVE,
						severity: "error",
						message: `You are assigning a non-primitive type '${toTypeString(typeB)}' to a primitive type '${toTypeString(typeA)}'`,
						location: { document, ...htmlAttr.location.name },
						htmlAttr,
						typeA,
						typeB
					}
				];
			}

			// Take into account that 'disabled=""' is equal to true
			else if (
				typeB.kind === SimpleTypeKind.STRING_LITERAL &&
				typeB.value.length === 0 &&
				isAssignableToType(typeA, {
					kind: SimpleTypeKind.BOOLEAN_LITERAL,
					value: true
				})
			) {
				return [];
			}

			// Take into account that assignments like maxlength="50" is allowed even though "50" is a string literal in this case.
			else if (isAssignableToSimpleTypeKind(typeA, SimpleTypeKind.NUMBER)) {
				if (typeB.kind !== SimpleTypeKind.STRING_LITERAL) {
					return [];
				}

				// Test if a potential string literal is a Number
				if (!isNaN(typeB.value as any)) {
					return [];
				}
			}
	}

	if (!isAssignableToType(typeA, typeB, checker)) {
		// Test if removing "undefined" from typeB would work and suggest using "ifDefined".
		if (assignment.kind === HtmlNodeAttrAssignmentKind.EXPRESSION && htmlAttr.kind === HtmlNodeAttrKind.ATTRIBUTE) {
			if (isAssignableToSimpleTypeKind(typeB, SimpleTypeKind.UNDEFINED)) {
				const typeBWithoutUndefined = removeUndefinedFromType(typeB);

				if (isAssignableToType(typeA, typeBWithoutUndefined, checker)) {
					return [
						{
							kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE_UNDEFINED,
							message: `Type '${toTypeString(typeB)}' is not assignable to '${toTypeString(typeA)}'. Fix it using 'ifDefined'?`,
							severity: "error",
							location: { document, ...htmlAttr.location.name },
							htmlAttr: htmlAttr as typeof htmlAttr & ({ assignment: typeof assignment }),
							typeA,
							typeB
						}
					];
				}
			}
		}
		// Fail if the two types are not assignable to each other.
		return [
			{
				kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE,
				message: `Type '${toTypeString(typeB)}' is not assignable to '${toTypeString(typeA)}'`,
				severity: "error",
				location: { document, ...htmlAttr.location.name },
				htmlAttr,
				typeA,
				typeB
			}
		];
	}
}

function validateHtmlAttrDirectiveAssignment(
	htmlAttr: HtmlNodeAttr,
	{ typeA, typeB }: { typeA: SimpleType; typeB: SimpleType },
	{ ts, program, logger }: LitAnalyzerRequest
): LitHtmlDiagnostic[] | undefined {
	const { assignment } = htmlAttr;
	if (assignment == null) return undefined;

	const checker = program.getTypeChecker();

	// Type check lit-html directives
	if (isAssignableToSimpleTypeKind(typeB, SimpleTypeKind.FUNCTION)) {
		// TODO: Support typechecking of lit-html directives by name.
		if (assignment.kind === HtmlNodeAttrAssignmentKind.EXPRESSION && ts.isCallExpression(assignment.expression) && isLitDirective(typeB)) {
			const functionName = assignment.expression.expression.getText();
			const args = Array.from(assignment.expression.arguments);

			switch (functionName) {
				case "ifDefined":
					if (args.length === 1) {
						const returnType = toSimpleType(checker.getTypeAtLocation(args[0]), checker);

						if (!isAssignableToType(typeA, returnType, checker)) {
							logger.debug(`${functionName}: ${simpleTypeToString(returnType)} not assignable to ${simpleTypeToString(typeA)}`);
						} else {
							logger.debug("is assignable!");
						}
					}
					break;
			}
		}

		if (isLitDirective(typeB)) {
			return [];
		}
	}

	return undefined;
}

/**
 * Checks whether a type is a lit directive.
 * It will return true if the type is a function that takes a Part type and returns a void.
 * @param type
 */
function isLitDirective(type: SimpleType): boolean {
	return type.kind === SimpleTypeKind.FUNCTION && type.argTypes.length > 0 && type.argTypes[0].type.name === "Part" && type.returnType.kind === SimpleTypeKind.VOID;
}

function removeUndefinedFromType(type: SimpleType): SimpleType {
	switch (type.kind) {
		case SimpleTypeKind.ALIAS:
			return {
				...type,
				target: removeUndefinedFromType(type.target)
			};
		case SimpleTypeKind.UNION:
			return {
				...type,
				types: type.types.filter(t => !isAssignableToSimpleTypeKind(t, SimpleTypeKind.UNDEFINED))
			};
	}

	return type;
}
