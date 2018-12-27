import { SimpleTypeKind } from "ts-simple-type";
import { CodeFixAction, DiagnosticWithLocation } from "typescript";
import { IP5NodeAttr } from "../parse-html-nodes/parse-html-p5/parse-html-types";
import { HtmlAttr, HtmlAttrKind, IHtmlAttrBuiltIn } from "../parse-html-nodes/types/html-attr-types";
import { HtmlNode } from "../parse-html-nodes/types/html-node-types";
import { HtmlReport, IHtmlReportBase } from "../parse-html-nodes/types/html-report-types";
import { ITsHtmlExtensionCodeFixContext, ITsHtmlExtensionDiagnosticContext, ITsHtmlExtensionParseAttrContext, ITsHtmlExtensionValidateExpressionContext } from "./i-ts-html-extension";
import { VanillaHtmlExtension, VanillaHtmlReport } from "./vanilla-html-extension";

const DIAGNOSTIC_SOURCE = "lit-html";

type LitHtmlAttributeModifier = "." | "?" | "@";

enum LitHtmlReportKind {
	LIT_BOOL_MOD_ON_NON_BOOL = "LIT_BOOL_MOD_ON_NON_BOOL",
	LIT_PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX = "LIT_PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX",
	LIT_INVALID_ATTRIBUTE_EXPRESSION_TYPE = "LIT_INVALID_ATTRIBUTE_EXPRESSION_TYPE"
}

interface IHtmlReportLitHtmlBoolMod extends IHtmlReportBase {
	kind: LitHtmlReportKind.LIT_BOOL_MOD_ON_NON_BOOL;
	typeA: string;
	typeB: string;
}

interface IHtmlReportLitHtmlPrimitiveNotAssignableToComplex extends IHtmlReportBase {
	kind: LitHtmlReportKind.LIT_PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX;
	isBooleanAssignment: boolean;
	typeA: string;
	typeB: string;
}

interface IHtmlReportLitHtmlInvalidAttributeExpressionType extends IHtmlReportBase {
	kind: LitHtmlReportKind.LIT_INVALID_ATTRIBUTE_EXPRESSION_TYPE;
	typeA: string;
	typeB: string;
}

type LitHtmlReport = IHtmlReportLitHtmlBoolMod | IHtmlReportLitHtmlPrimitiveNotAssignableToComplex | IHtmlReportLitHtmlInvalidAttributeExpressionType;

/**
 * An extension that extends ts-html with lit-html functionality.
 */
export class LitHtmlExtension extends VanillaHtmlExtension {
	/**
	 * Returns code fixes for a lit-related html report.
	 * @param htmlAttr
	 * @param htmlReport
	 * @param context
	 */
	codeFixesForHtmlAttr(htmlAttr: HtmlAttr, htmlReport: HtmlReport & LitHtmlReport, context: ITsHtmlExtensionCodeFixContext): CodeFixAction[] | undefined {
		const { start } = htmlAttr.location.name;

		switch (htmlReport.kind) {
			case LitHtmlReportKind.LIT_BOOL_MOD_ON_NON_BOOL:
			case LitHtmlReportKind.LIT_PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX:
				const modifierLength = htmlAttr.modifier ? htmlAttr.modifier.length : 0;

				return [
					{
						fixName: `change_modifier`,
						description: `Use '.' modifier instead`,
						changes: [
							{
								fileName: context.file.fileName,
								textChanges: [
									{
										span: {
											start: start - modifierLength,
											length: modifierLength
										},
										newText: "."
									}
								]
							}
						]
					}
				];
		}
	}

	/**
	 * Returns name and modifier from an attribute name.
	 * @param attrName
	 */
	parseAttrName(attrName: string) {
		return parseLitAttrName(attrName);
	}

	/**
	 * Returns lit-related diagnostics for an attribute.
	 * @param htmlAttr
	 * @param htmlReport
	 * @param context
	 */
	diagnosticsForHtmlAttr(htmlAttr: HtmlAttr, htmlReport: VanillaHtmlReport | LitHtmlReport, context: ITsHtmlExtensionDiagnosticContext): DiagnosticWithLocation[] {
		const { start, end } = htmlAttr.location.name;

		const messageText = (() => {
			switch (htmlReport.kind) {
				case LitHtmlReportKind.LIT_INVALID_ATTRIBUTE_EXPRESSION_TYPE:
					return `Type '${htmlReport.typeB}' is not assignable to '${htmlReport.typeA}'`;
				case LitHtmlReportKind.LIT_BOOL_MOD_ON_NON_BOOL:
					return `You are using a boolean attribute modifier on a non boolean type '${htmlReport.typeA}'`;
				case LitHtmlReportKind.LIT_PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX:
					if (htmlReport.isBooleanAssignment) {
						return `You are assigning a boolean to a non-primitive type '${htmlReport.typeA}'. Use '.' modifier instead?`;
					} else {
						return `You are assigning the string '${htmlReport.typeB}' to a non-primitive type '${htmlReport.typeA}'. Use '.' modifier instead?`;
					}
			}
		})();

		return [
			...super.diagnosticsForHtmlAttr(htmlAttr, htmlReport as VanillaHtmlReport, context),
			...(messageText != null
				? [
						{
							file: context.file,
							length: end - start,
							start,
							messageText,
							category: context.store.ts.DiagnosticCategory.Error,
							source: DIAGNOSTIC_SOURCE,
							code: 2322 // Type '{0}' is not assignable to type '{1}'.
						}
				  ]
				: [])
		];
	}

	/**
	 * Parses a lit-specific html attribute.
	 * @param p5Attr
	 * @param htmlNode
	 * @param context
	 */
	parseHtmlAttr(p5Attr: IP5NodeAttr, htmlNode: HtmlNode, context: ITsHtmlExtensionParseAttrContext): IHtmlAttrBuiltIn | undefined {
		// Ignore @ for now. Treat them as built in attributes that will become "ANY"
		// TODO: Support lit-modifier "@"
		if (context.htmlAttrBase.modifier === "@") {
			return {
				...context.htmlAttrBase,
				kind: HtmlAttrKind.BUILT_IN
			};
		}

		return super.parseHtmlAttr(p5Attr, htmlNode, context);
	}

	/**
	 * Validates an attribute assignment: lit-html style.
	 * @param htmlAttr
	 * @param context
	 */
	validateHtmlAttrAssignment(htmlAttr: HtmlAttr, context: ITsHtmlExtensionValidateExpressionContext): VanillaHtmlReport[] | undefined;
	validateHtmlAttrAssignment(
		htmlAttr: HtmlAttr,
		{ getTypeString, isAssignableTo, isAssignableToValue, isAssignableToPrimitive, isAssignableToSimpleTypeKind }: ITsHtmlExtensionValidateExpressionContext
	): VanillaHtmlReport[] | LitHtmlReport[] | undefined {
		if (htmlAttr.assignment == null) return;

		const {
			assignment: { isBooleanAssignment, typeA, typeB }
		} = htmlAttr;

		// Opt out if typeB is a function (eg. lit-html directive).
		// TODO: Support typechecking of lit-html directives.
		if (isAssignableToSimpleTypeKind(typeB, SimpleTypeKind.FUNCTION)) return [];

		switch (htmlAttr.modifier) {
			case "?":
				// Test if the user is trying to use the ? modifier on a non-boolean type.
				if (!isAssignableTo(typeA, { kind: SimpleTypeKind.BOOLEAN })) {
					return [
						{
							kind: LitHtmlReportKind.LIT_BOOL_MOD_ON_NON_BOOL,
							typeA: getTypeString(typeA),
							typeB: getTypeString(typeB)
						}
					];
				}
				break;

			case ".":
				break;

			default:
				// In this case there is no modifier. Therefore:
				// Only primitive types should be allowed as "typeB" and "typeA".

				if (!isAssignableToPrimitive(typeA)) {
					// Fail if the user is trying to assign a primitive value to a complex value.
					return [
						{
							kind: LitHtmlReportKind.LIT_PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX,
							isBooleanAssignment,
							typeA: getTypeString(typeA),
							typeB: getTypeString(typeB) // isBooleanAssignment ? "boolean" : "string"
						}
					];
				} else if (isAssignableToPrimitive(typeB) && !(isAssignableToSimpleTypeKind(typeA, SimpleTypeKind.STRING) || isAssignableToSimpleTypeKind(typeA, SimpleTypeKind.STRING_LITERAL))) {
					// Return if typeA and typeB are both primitives and we don't have any modifiers.
					// However if typeA is a string, validate that the "value" (typeB which is a string literal) is assignable to typeA
					return [];
				}
		}

		if (!isAssignableTo(typeA, typeB)) {
			// Fail if the two types are not assignable to each other.
			return [
				{
					kind: LitHtmlReportKind.LIT_INVALID_ATTRIBUTE_EXPRESSION_TYPE,
					typeA: getTypeString(typeA),
					typeB: getTypeString(typeB)
				}
			];
		}
	}
}

/**
 * Parses an attribute name returning a name and eg. a modifier.
 * Examples:
 *  - ?disabled="..."
 *  - .myProp="..."
 *  - @click="..."
 * @param attributeName
 */
function parseLitAttrName(attributeName: string): { name: string; modifier?: LitHtmlAttributeModifier } {
	const [, modifier, name] = attributeName.match(/^([.?@])?(.*)/);
	return { name, modifier: modifier as LitHtmlAttributeModifier };
}
