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
	toSimpleType,
	toTypeString
} from "ts-simple-type";
import { Type, TypeChecker } from "typescript";
import { LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER, LIT_HTML_PROP_ATTRIBUTE_MODIFIER } from "../../../constants";
import { HtmlNodeAttrAssignmentKind } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-attr-assignment-types";
import { HtmlNodeAttr, HtmlNodeAttrKind } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-attr-types";
import { TsLitPluginStore } from "../../../state/store";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../../types/lit-diagnostic";

/**
 * Validates an attribute assignment: lit-html style.
 * @param htmlAttr
 * @param checker
 * @param store
 */
export function validateHtmlAttrAssignment(htmlAttr: HtmlNodeAttr, checker: TypeChecker, store: TsLitPluginStore): LitHtmlDiagnostic[] {
	const { assignment } = htmlAttr;
	if (assignment == null) return [];

	const typeBInferred: SimpleType | Type = (() => {
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
	})();

	const typeB = isSimpleType(typeBInferred) ? typeBInferred : toSimpleType(typeBInferred, checker);

	// Temp ugly check until I refactor this section
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
						location: htmlAttr.location.name,
						typeB: toTypeString(typeB)
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
							location: htmlAttr.location.name
						}
					];
			}
			break;
	}

	if (htmlAttr.kind === HtmlNodeAttrKind.ATTRIBUTE && assignment.kind === HtmlNodeAttrAssignmentKind.STRING) {
		// Check for slots
		if (htmlAttr.name === "slot") {
			const parent = htmlAttr.htmlNode.parent;
			if (parent != null) {
				const parentHtmlTag = store.getHtmlTag(parent.tagName);

				if (parentHtmlTag != null && parentHtmlTag.slots.length > 0) {
					const slotName = assignment.value;
					const slots = Array.from(store.getAllSlotsForTag(parentHtmlTag.tagName));
					const matchingSlot = slots.find(slot => slot.name === slotName);

					if (matchingSlot == null) {
						const validSlotNames = slots.map(s => s.name);
						const message =
							validSlotNames.length === 1 && validSlotNames[0].length === 0
								? `Invalid slot name. Only the unnamed slot is valid for <${parentHtmlTag.tagName}>`
								: `Invalid slot name. Valid slot names for <${parentHtmlTag.tagName}> are: ${validSlotNames.map(n => `'${n}'`).join(" | ")}`;

						return [
							{
								kind: LitHtmlDiagnosticKind.INVALID_SLOT_NAME,
								message,
								validSlotNames,
								severity: "error",
								location: htmlAttr.location.name
							}
						];
					}
				}
			}
		}
	}

	const htmlAttrTarget = store.getHtmlAttrTarget(htmlAttr);
	if (htmlAttrTarget == null) return [];

	const typeA = htmlAttrTarget.getType();

	// Type check lit-html directives
	if (isAssignableToSimpleTypeKind(typeB, SimpleTypeKind.FUNCTION)) {
		// TODO: Support typechecking of lit-html directives by name.
		/*if (assignment.kind === HtmlNodeAttrAssignmentKind.EXPRESSION && tsModule.ts.isCallExpression(assignment.expression) && isLitDirective(typeB)) {
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
		 }*/
		return [];
	}

	switch (htmlAttr.modifier) {
		case LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER:
			// Test if the user is trying to use the ? modifier on a non-boolean type.
			if (!isAssignableToType(typeA, { kind: SimpleTypeKind.BOOLEAN })) {
				return [
					{
						kind: LitHtmlDiagnosticKind.BOOL_MOD_ON_NON_BOOL,
						message: `You are using a boolean attribute modifier on a non boolean type '${toTypeString(typeA)}'`,
						severity: "error",
						location: htmlAttr.location.name,
						htmlAttr,
						typeA: toTypeString(typeA),
						typeB: toTypeString(typeB)
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
						location: htmlAttr.location.name,
						htmlAttr,
						typeA: toTypeString(typeA),
						typeB: toTypeString(typeB)
					}
				];
			} else if (!isAssignableToPrimitiveType(typeB)) {
				return [
					{
						kind: LitHtmlDiagnosticKind.COMPLEX_NOT_ASSIGNABLE_TO_PRIMITIVE,
						severity: "error",
						message: `You are assigning a non-primitive type '${toTypeString(typeB)}' to a primitive type '${toTypeString(typeA)}'`,
						location: htmlAttr.location.name,
						htmlAttr,
						typeA: toTypeString(typeA),
						typeB: toTypeString(typeB)
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
		// Fail if the two types are not assignable to each other.
		return [
			{
				kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE,
				message: `Type '${toTypeString(typeB)}' is not assignable to '${toTypeString(typeA)}'`,
				severity: "error",
				location: htmlAttr.location.name,
				htmlAttr,
				typeA: toTypeString(typeA),
				typeB: toTypeString(typeB)
			}
		];
	}

	return [];
}

/**
 * Checks whether a type is a lit directive.
 * It will return true if the type is a function that takes a Part type and returns a void.
 * @param type
 */
// @ts-ignore
function isLitDirective(type: SimpleType): boolean {
	return type.kind === SimpleTypeKind.FUNCTION && type.argTypes.length > 0 && type.argTypes[0].type.name === "Part" && type.returnType.kind === SimpleTypeKind.VOID;
}
