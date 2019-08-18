import {
	isAssignableToPrimitiveType,
	isAssignableToSimpleTypeKind,
	isAssignableToType,
	isAssignableToValue,
	isSimpleType,
	SimpleType,
	SimpleTypeBooleanLiteral,
	SimpleTypeEnumMember,
	SimpleTypeKind,
	SimpleTypeString,
	SimpleTypeStringLiteral,
	toSimpleType,
	toTypeString
} from "ts-simple-type";
import { Type, TypeChecker } from "typescript";
import {
	LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER,
	LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER,
	LIT_HTML_PROP_ATTRIBUTE_MODIFIER
} from "../../../constants";
import { isRuleEnabled, litDiagnosticRuleSeverity } from "../../../lit-analyzer-config";
import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { HtmlNodeAttrAssignment, HtmlNodeAttrAssignmentKind } from "../../../types/html-node/html-node-attr-assignment-types";
import { HtmlNodeAttr, HtmlNodeAttrKind, IHtmlNodeAttr } from "../../../types/html-node/html-node-attr-types";
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

	const { assignment } = htmlAttr;
	if (assignment == null) return [];

	const checker = program.getTypeChecker();

	// ==========================================
	// Let's start by validating the RHS (typeB)
	// ==========================================

	// Relax the type we are looking at an expression in javascript files
	const inJavascriptFile = request.file.fileName.endsWith(".js");
	const shouldRelaxTypeB = 1 !== 1 && inJavascriptFile && assignment.kind === HtmlNodeAttrAssignmentKind.EXPRESSION;

	// Infer the type of the RHS
	//const typeBInferred = shouldRelaxTypeB ? ({ kind: SimpleTypeKind.ANY } as SimpleType) : inferTypeFromAssignment(assignment, checker);
	const typeBInferred = inferTypeFromAssignment(assignment, checker);

	// Convert typeB to SimpleType
	const typeB = (() => {
		const type = isSimpleType(typeBInferred) ? typeBInferred : toSimpleType(typeBInferred, checker);
		return shouldRelaxTypeB ? relaxType(type) : type;
	})();

	// Validate lit assignment rules
	const rulesResult = validateHtmlAttrAssignmentRules(htmlAttr, typeB, request);
	if (rulesResult != null) return rulesResult;

	// Find a corresponding target for this attribute
	const htmlAttrTarget = htmlStore.getHtmlAttrTarget(htmlAttr);
	if (htmlAttrTarget == null) return [];

	// ==========================================
	// Now, let's validate the assignment
	//  LHS === RHS (typeA === typeB)
	// ==========================================
	const typeA = htmlAttrTarget.getType();

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

function validateHtmlAttrAssignmentRules(
	htmlAttr: HtmlNodeAttr,
	typeB: SimpleType,
	{ document, config }: LitAnalyzerRequest
): LitHtmlDiagnostic[] | undefined {
	const { assignment } = htmlAttr;
	if (assignment == null) return undefined;

	switch (htmlAttr.kind) {
		case HtmlNodeAttrKind.EVENT_LISTENER:
			if (isRuleEnabled(config, "no-noncallable-event-binding")) {
				// Make sure that there is a function as event listener value.
				// Here we catch errors like: @click="onClick()"
				if (!isTypeBindableToEventListener(typeB)) {
					return [
						{
							kind: LitHtmlDiagnosticKind.NO_EVENT_LISTENER_FUNCTION,
							message: `You are setting up an event listener with a non-callable type '${toTypeString(typeB)}'`,
							source: "no-noncallable-event-binding",
							severity: litDiagnosticRuleSeverity(config, "no-noncallable-event-binding"),
							location: { document, ...htmlAttr.location.name },
							typeB
						}
					];
				}
			}

			return [];

		// Check if we have a property assignment without a corresponding expression as value
		case HtmlNodeAttrKind.PROPERTY:
			switch (assignment.kind) {
				case HtmlNodeAttrAssignmentKind.STRING:
				case HtmlNodeAttrAssignmentKind.BOOLEAN:
					if (isRuleEnabled(config, "no-expressionless-property-binding")) {
						return [
							{
								kind: LitHtmlDiagnosticKind.PROPERTY_NEEDS_EXPRESSION,
								message: `You are using a property binding without an expression`,
								severity: litDiagnosticRuleSeverity(config, "no-expressionless-property-binding"),
								source: "no-expressionless-property-binding",
								location: { document, ...htmlAttr.location.name }
							}
						];
					}
			}
			break;
	}
	return;
}

function validateStringifiedAssignment(
	htmlAttr: IHtmlNodeAttr,
	{ typeA, typeB }: { typeA: SimpleType; typeB: SimpleType },
	{ document, program, config }: LitAnalyzerRequest
): LitHtmlDiagnostic[] | undefined {
	const { assignment } = htmlAttr;
	if (assignment == null) return undefined;

	// Test assignments to all possible type kinds
	const typeAIsAssignableTo = {
		[SimpleTypeKind.STRING]: lazy(() => isAssignableToSimpleTypeKind(typeA, [SimpleTypeKind.STRING, SimpleTypeKind.STRING_LITERAL], { op: "or" })),
		[SimpleTypeKind.NUMBER]: lazy(() => isAssignableToSimpleTypeKind(typeA, [SimpleTypeKind.NUMBER, SimpleTypeKind.NUMBER_LITERAL], { op: "or" })),
		[SimpleTypeKind.BOOLEAN]: lazy(() => isAssignableToSimpleTypeKind(typeA, [SimpleTypeKind.BOOLEAN, SimpleTypeKind.BOOLEAN_LITERAL], { op: "or" })),
		[SimpleTypeKind.ARRAY]: lazy(() => isAssignableToSimpleTypeKind(typeA, [SimpleTypeKind.ARRAY, SimpleTypeKind.TUPLE], { op: "or" })),
		[SimpleTypeKind.OBJECT]: lazy(() =>
			isAssignableToSimpleTypeKind(typeA, [SimpleTypeKind.OBJECT, SimpleTypeKind.INTERFACE, SimpleTypeKind.CLASS], { op: "or" })
		)
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
			if (!isNaN((typeB.value as unknown) as number) && isAssignableToValue(typeA, Number(typeB.value))) {
				return [];
			}
		}
	}

	// Tagged template attribute 'expression' assignments like 'max="${this.max}"'
	else if (assignment.kind === HtmlNodeAttrAssignmentKind.EXPRESSION) {
		// Test if removing "null" from typeB would work and suggest using "ifDefined(exp === null ? undefined : exp)".
		if (isRuleEnabled(config, "no-nullable-attribute-binding") && isAssignableToSimpleTypeKind(typeB, SimpleTypeKind.NULL)) {
			return [
				{
					kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE_NULL,
					message: `This attribute binds the type '${toTypeString(typeB)}' which can be 'null'. Fix it using 'ifDefined' and strict equality check?`,
					source: "no-nullable-attribute-binding",
					severity: litDiagnosticRuleSeverity(config, "no-nullable-attribute-binding"),
					location: { document, ...htmlAttr.location.name },
					htmlAttr: htmlAttr as typeof htmlAttr & ({ assignment: typeof assignment }),
					typeA,
					typeB
				}
			];
		}

		// Test if removing "undefined" from typeB would work and suggest using "ifDefined".
		else if (isRuleEnabled(config, "no-nullable-attribute-binding") && isAssignableToSimpleTypeKind(typeB, SimpleTypeKind.UNDEFINED)) {
			return [
				{
					kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE_UNDEFINED,
					message: `This attribute binds the type '${toTypeString(typeB)}' which can be 'undefined'. Fix it using 'ifDefined'?`,
					source: "no-nullable-attribute-binding",
					severity: litDiagnosticRuleSeverity(config, "no-nullable-attribute-binding"),
					location: { document, ...htmlAttr.location.name },
					htmlAttr: htmlAttr as typeof htmlAttr & ({ assignment: typeof assignment }),
					typeA,
					typeB
				}
			];
		}

		// Take into account string === number expressions: 'value="${this.max}"'
		else if (
			isAssignableToSimpleTypeKind(typeB, [SimpleTypeKind.NUMBER, SimpleTypeKind.NUMBER_LITERAL], { op: "or" }) &&
			typeAIsAssignableTo[SimpleTypeKind.STRING]()
		) {
			return [];
		}

		// Take into account: string === boolean expressions: 'aria-expanded="${this.open}"'
		else if (isAssignableToSimpleTypeKind(typeB, [SimpleTypeKind.BOOLEAN, SimpleTypeKind.BOOLEAN_LITERAL], { op: "or" })) {
			if (isRuleEnabled(config, "no-boolean-in-attribute-binding")) {
				if (isAssignableToType(typeA, STRINGIFIED_BOOLEAN_TYPE, program)) {
					return [];
				} else {
					return [
						{
							kind: LitHtmlDiagnosticKind.EXPRESSION_ONLY_ASSIGNABLE_WITH_BOOLEAN_BINDING,
							severity: litDiagnosticRuleSeverity(config, "no-boolean-in-attribute-binding"),
							source: "no-boolean-in-attribute-binding",
							message: `The type '${toTypeString(typeB)}' is a boolean type but you are not using a boolean binding. Change to boolean binding?`,
							location: { document, ...htmlAttr.location.name },
							htmlAttr,
							typeA,
							typeB
						}
					];
				}
			}
		}

		// Take into account that assigning to a boolean without "?" binding would result in "undefined" being assigned.
		// Example: <input disabled="${true}" />
		else if (typeAIsAssignableTo[SimpleTypeKind.BOOLEAN]() && !typeAIsAssignableToMultiple()) {
			if (isRuleEnabled(config, "no-boolean-in-attribute-binding")) {
				return [
					{
						kind: LitHtmlDiagnosticKind.EXPRESSION_ONLY_ASSIGNABLE_WITH_BOOLEAN_BINDING,
						severity: litDiagnosticRuleSeverity(config, "no-boolean-in-attribute-binding"),
						source: "no-boolean-in-attribute-binding",
						message: `The '${htmlAttr.name}' attribute is of boolean type but you are not using a boolean binding. Change to boolean binding?`,
						location: { document, ...htmlAttr.location.name },
						htmlAttr,
						typeA,
						typeB
					}
				];
			}
		}
	}
	return;
}

/**
 * Returns if this type can be used in a event listener binding
 * @param type
 */
function isTypeBindableToEventListener(type: SimpleType): boolean {
	// Callable types can be used in the binding
	if (
		isAssignableToSimpleTypeKind(type, [SimpleTypeKind.FUNCTION, SimpleTypeKind.METHOD, SimpleTypeKind.UNKNOWN], {
			matchAny: true,
			op: "or"
		})
	) {
		return true;
	}

	// Object types with attributes for the setup function of the event listener can be used
	if (type.kind === SimpleTypeKind.OBJECT || type.kind === SimpleTypeKind.INTERFACE) {
		// The "handleEvent" property must be present
		const handleEventFunction = type.members != null ? type.members.find(m => m.name === "handleEvent") : undefined;

		// The "handleEvent" property must be callable
		if (handleEventFunction != null) {
			return isTypeBindableToEventListener(handleEventFunction.type);
		}
	}

	return false;
}
