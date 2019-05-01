import {
	isAssignableToPrimitiveType,
	isAssignableToSimpleTypeKind,
	isAssignableToType,
	isAssignableToValue,
	isSimpleType,
	SimpleType,
	SimpleTypeBooleanLiteral,
	SimpleTypeKind,
	SimpleTypeString,
	SimpleTypeStringLiteral,
	toSimpleType,
	toTypeString
} from "ts-simple-type";
import { CallExpression, Type, TypeChecker } from "typescript";
import { LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER, LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER, LIT_HTML_PROP_ATTRIBUTE_MODIFIER } from "../../../constants";
import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { HtmlNodeAttrAssignment, HtmlNodeAttrAssignmentKind } from "../../../types/html-node/html-node-attr-assignment-types";
import { HtmlNodeAttr, HtmlNodeAttrKind } from "../../../types/html-node/html-node-attr-types";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../../../types/lit-diagnostic";
import { lazy } from "../../../util/general-util";

const STRINGIFIED_BOOLEAN_TYPE: SimpleType = {
	kind: SimpleTypeKind.UNION,
	types: [
		{
			kind: SimpleTypeKind.STRING_LITERAL,
			value: "true"
		},
		{ kind: SimpleTypeKind.STRING_LITERAL, value: "false" }
	]
};

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
			if (
				!isAssignableToSimpleTypeKind(typeB, [SimpleTypeKind.FUNCTION, SimpleTypeKind.METHOD, SimpleTypeKind.UNKNOWN], {
					matchAny: true,
					op: "or"
				})
			) {
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
							message: `You are using the property binding without an expression`,
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

	switch (htmlAttr.modifier) {
		case LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER:
			// Test if the user is trying to use the ? modifier on a non-boolean type.
			if (!isAssignableToType(typeA, { kind: SimpleTypeKind.BOOLEAN }, program)) {
				return [
					{
						kind: LitHtmlDiagnosticKind.BOOL_MOD_ON_NON_BOOL,
						message: `You are using a boolean binding on a non boolean type '${toTypeString(typeA)}'`,
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

		case LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER:
			break;

		default:
			// In this case there is no modifier. Therefore:

			// Only primitive types should be allowed as "typeB" and "typeA".
			if (!isAssignableToPrimitiveType(typeA)) {
				const message = (() => {
					if (assignment != null) {
						if (assignment.kind === HtmlNodeAttrAssignmentKind.BOOLEAN) {
							return `You are assigning a boolean to a non-primitive type '${toTypeString(typeA)}'. Use '.' binding instead?`;
						} else if (assignment.kind === HtmlNodeAttrAssignmentKind.STRING && assignment.value.length > 0) {
							return `You are assigning the string '${toTypeString(typeB)}' to a non-primitive type '${toTypeString(typeA)}'. Use '.' binding instead?`;
						}
					}
					return `You are assigning the primitive '${toTypeString(typeB)}' to a non-primitive type '${toTypeString(typeA)}'. Use '.' binding instead?`;
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

			// Test assignments to all possible type kinds
			const typeAIsAssignableTo = {
				[SimpleTypeKind.STRING]: lazy(() => isAssignableToSimpleTypeKind(typeA, [SimpleTypeKind.STRING, SimpleTypeKind.STRING_LITERAL], { op: "or" })),
				[SimpleTypeKind.NUMBER]: lazy(() => isAssignableToSimpleTypeKind(typeA, [SimpleTypeKind.NUMBER, SimpleTypeKind.NUMBER_LITERAL], { op: "or" })),
				[SimpleTypeKind.BOOLEAN]: lazy(() => isAssignableToSimpleTypeKind(typeA, [SimpleTypeKind.BOOLEAN, SimpleTypeKind.BOOLEAN_LITERAL], { op: "or" })),
				[SimpleTypeKind.ARRAY]: lazy(() => isAssignableToSimpleTypeKind(typeA, [SimpleTypeKind.ARRAY, SimpleTypeKind.TUPLE], { op: "or" })),
				[SimpleTypeKind.OBJECT]: lazy(() => isAssignableToSimpleTypeKind(typeA, [SimpleTypeKind.OBJECT, SimpleTypeKind.INTERFACE, SimpleTypeKind.CLASS], { op: "or" }))
			};

			const typeAIsAssignableToMultiple = lazy(() => Object.values(typeAIsAssignableTo).filter(assignable => assignable()).length > 1);

			// Normal attribute 'string' assignments like 'max="123"'
			if (typeB.kind === SimpleTypeKind.STRING_LITERAL) {
				// Take into account that 'disabled=""' is equal to true
				if (typeB.value.length === 0 && typeAIsAssignableTo[SimpleTypeKind.BOOLEAN]()) {
					return [];
				}

				// Take into account that assignments like maxlength="50" (which is a number) is allowed even though "50" is a string literal in this case.
				else if (typeAIsAssignableTo[SimpleTypeKind.NUMBER]()) {
					// Test if a potential string literal is a Number
					if (!isNaN(typeB.value as any) && isAssignableToValue(typeA, Number(typeB.value))) {
						return [];
					}
				}
			}

			// Tagged template attribute 'expression' assignments like 'max="${this.max}"'
			else if (assignment.kind === HtmlNodeAttrAssignmentKind.EXPRESSION) {
				// Take into account that assigning a boolean without "?" binding would result in "undefined" being assigned.
				// Example: <input disabled="${true}" />
				if (typeAIsAssignableTo[SimpleTypeKind.BOOLEAN]() && !typeAIsAssignableToMultiple()) {
					return [
						{
							kind: LitHtmlDiagnosticKind.EXPRESSION_ONLY_ASSIGNABLE_WITH_BOOLEAN_BINDING,
							severity: "error",
							message: `The '${htmlAttr.name}' attribute is a boolean type but you not using a boolean binding. Change to boolean binding?`,
							location: { document, ...htmlAttr.location.name },
							htmlAttr,
							typeA,
							typeB
						}
					];
				}

				// Take into account string === number expressions: 'value="${this.max}"'
				else if (isAssignableToSimpleTypeKind(typeB, [SimpleTypeKind.NUMBER, SimpleTypeKind.NUMBER_LITERAL], { op: "or" }) && typeAIsAssignableTo[SimpleTypeKind.STRING]()) {
					return [];
				}

				// Take into account string === boolean expressions: 'aria-expanded="${this.open}"'
				else if (isAssignableToSimpleTypeKind(typeB, [SimpleTypeKind.BOOLEAN, SimpleTypeKind.BOOLEAN_LITERAL], { op: "or" }) && isAssignableToType(typeA, STRINGIFIED_BOOLEAN_TYPE, program)) {
					return [];
				}
			}
	}

	if (!isAssignableToType(typeA, typeB, program)) {
		// Test if removing "undefined" from typeB would work and suggest using "ifDefined".
		if (assignment.kind === HtmlNodeAttrAssignmentKind.EXPRESSION && htmlAttr.kind === HtmlNodeAttrKind.ATTRIBUTE) {
			if (isAssignableToSimpleTypeKind(typeB, SimpleTypeKind.UNDEFINED)) {
				const typeBWithoutUndefined = removeUndefinedFromType(typeB);

				if (isAssignableToType(typeA, typeBWithoutUndefined, program)) {
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

function validateHtmlAttrDirectiveAssignment(htmlAttr: HtmlNodeAttr, { typeA, typeB }: { typeA: SimpleType; typeB: SimpleType }, request: LitAnalyzerRequest): LitHtmlDiagnostic[] | undefined {
	const { assignment } = htmlAttr;
	if (assignment == null) return undefined;

	const { ts, program, document } = request;
	const checker = program.getTypeChecker();

	// Type check lit-html directives
	if (isAssignableToSimpleTypeKind(typeB, SimpleTypeKind.FUNCTION)) {
		if (assignment.kind === HtmlNodeAttrAssignmentKind.EXPRESSION && ts.isCallExpression(assignment.expression) && isLitDirective(typeB)) {
			const functionName = assignment.expression.expression.getText();
			const args = Array.from(assignment.expression.arguments);

			switch (functionName) {
				case "ifDefined":
					// Example: html`<img src="${ifDefined(imageUrl)}">`;
					// Take the argument to ifDefined and remove undefined from the type union (if possible).
					// Then test if this result is now assignable to the attribute type.

					if (args.length === 1) {
						const returnType = toSimpleType(checker.getTypeAtLocation(args[0]), checker);
						const returnTypeWithoutUndefined = removeUndefinedFromType(returnType);

						return (
							validateHtmlAttrAssignmentTypes(
								htmlAttr,
								{
									typeA,
									typeB: returnTypeWithoutUndefined
								},
								request
							) || []
						);
					}

					break;

				case "guard":
					// Example: html`<img src="${guard([imageUrl], () => Math.random() > 0.5 ? imageUrl : "nothing.png")}">`;
					// Check if the return value type of the function expression given to the second parameter is assignable to the attribute.
					if (args.length === 2) {
						const returnFunctionType = toSimpleType(checker.getTypeAtLocation(args[1]), checker);

						if (returnFunctionType.kind === SimpleTypeKind.FUNCTION) {
							const returnType = returnFunctionType.returnType;

							if (returnType == null) return [];

							return (
								validateHtmlAttrAssignmentTypes(
									htmlAttr,
									{
										typeA,
										typeB: returnType
									},
									request
								) || []
							);
						}
					}
					break;

				case "classMap":
					// Report error if "classMap" is not being used on the "class" attribute.
					if (htmlAttr.name !== "class" || htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE) {
						return [
							{
								kind: LitHtmlDiagnosticKind.DIRECTIVE_NOT_ALLOWD_ON_ATTRIBUTE,
								message: `The 'classMap' directive can only be used in an attribute binding for the 'class' attribute`,
								severity: "error",
								location: { document, ...htmlAttr.location.name }
							}
						];
					}
					break;

				case "styleMap":
					// Report error if "styleMap" is not being used on the "style" attribute.
					if (htmlAttr.name !== "style" || htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE) {
						return [
							{
								kind: LitHtmlDiagnosticKind.DIRECTIVE_NOT_ALLOWD_ON_ATTRIBUTE,
								message: `The 'styleMap' directive can only be used in an attribute binding for the 'style' attribute`,
								severity: "error",
								location: { document, ...htmlAttr.location.name }
							}
						];
					}
					break;

				case "unsafeHTML":
				case "cache":
				case "repeat":
				case "asyncReplace":
				case "asyncAppend":
					// These directives can only be used within a text binding.
					// This function validating assignments is per definition used NOT in a text binding
					return [
						{
							kind: LitHtmlDiagnosticKind.DIRECTIVE_ONLY_ALLOWED_IN_TEXT_BINDING,
							message: `The '${functionName}' directive can only be used within a text binding.`,
							severity: "error",
							location: { document, ...htmlAttr.location.name }
						}
					];
			}
		}

		// Now we have an unknown (user defined) directive.
		// Return empty array and opt out of any more type checking for this directive
		return [];
	}

	// Make sure that "classMap" and "styleMap" directives are not used in mixed bindings.
	else if (assignment.kind === HtmlNodeAttrAssignmentKind.MIXED) {
		// Find all relevant usage of directives in the assignment
		const directivesUnavailableInMixed = assignment.values
			.filter((value): value is CallExpression => typeof value !== "string" && ts.isCallExpression(value))
			.filter(exp => ["classMap", "styleMap"].includes(exp.expression.getText()))
			.map(exp => ({
				type: toSimpleType(checker.getTypeAtLocation(exp), checker),
				name: exp.expression.getText()
			}))
			.filter(directive => isLitDirective(directive.type));

		if (directivesUnavailableInMixed.length > 0) {
			const directiveName = directivesUnavailableInMixed[0].name;

			return [
				{
					kind: LitHtmlDiagnosticKind.DIRECTIVE_NOT_ALLOWED_IN_MIXED_ASSIGNMENT,
					message: `The '${directiveName}' directive must be the entire value of the attribute.`,
					severity: "error",
					location: { document, ...htmlAttr.location.name }
				}
			];
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
	switch (type.kind) {
		case SimpleTypeKind.ALIAS:
			return type.name === "DirectiveFn" || isLitDirective(type.target);
		case SimpleTypeKind.FUNCTION:
			return (
				type.kind === SimpleTypeKind.FUNCTION &&
				type.argTypes != null &&
				type.argTypes.length > 0 &&
				["Part", "NodePart", "AttributePart", "PropertyPart"].includes(type.argTypes[0].type.name || "") &&
				type.returnType != null &&
				type.returnType.kind === SimpleTypeKind.VOID
			);
		default:
			return false;
	}
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
