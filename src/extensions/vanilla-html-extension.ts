import { TypeKind } from "ts-is-assignable";
import { CompletionEntry, DiagnosticWithLocation, QuickInfo, ScriptElementKind } from "typescript";
import { IP5NodeAttr, IP5TagNode } from "../parse-html-nodes/parse-html-p5/parse-html-types";
import { IHtmlAttrAssignment } from "../parse-html-nodes/types/html-attr-assignment-types";
import { HtmlAttr, HtmlAttrKind, IHtmlAttrBuiltIn } from "../parse-html-nodes/types/html-attr-types";
import { HtmlNode, HtmlNodeKind, IHtmlNodeBuiltIn } from "../parse-html-nodes/types/html-node-types";
import { IHtmlReportBase } from "../parse-html-nodes/types/html-report-types";
import {
	getBuiltInAttributeType,
	getBuiltInAttrsForTag,
	getBuiltInTags,
	getDescriptionForBuiltInAttr,
	getDescriptionForBuiltInTag,
	isBuiltInAttrForTag,
	isBuiltInTag
} from "../util/html-documentation";
import {
	ITsHtmlExtension,
	ITsHtmlExtensionCompletionContext,
	ITsHtmlExtensionDiagnosticContext,
	ITsHtmlExtensionParseAttrAssignmentContext,
	ITsHtmlExtensionParseAttrContext,
	ITsHtmlExtensionParseHtmlNodeContext,
	ITsHtmlExtensionQuickInfoContext,
	ITsHtmlExtensionValidateExpressionContext
} from "./i-ts-html-extension";

const DIAGNOSTIC_SOURCE = "ts-html";

export enum VanillaHtmlReportKind {
	HTML_INVALID_ATTRIBUTE_EXPRESSION_TYPE = "HTML_INVALID_ATTRIBUTE_EXPRESSION_TYPE"
}

export interface IHtmlReportVanillaHtmlInvalidAttributeExpressionType extends IHtmlReportBase {
	kind: VanillaHtmlReportKind.HTML_INVALID_ATTRIBUTE_EXPRESSION_TYPE;
	typeAPrimitive: boolean;
	typeBPrimitive: boolean;
	typeA: string;
	typeB: string;
}

export type VanillaHtmlReport = IHtmlReportVanillaHtmlInvalidAttributeExpressionType;

/**
 * An extension that extends ts-html with basic html functionality.
 */
export class VanillaHtmlExtension implements ITsHtmlExtension {
	/**
	 * Returns completions for built in attributes.
	 * @param htmlNode
	 * @param context
	 */
	completionsForHtmlAttrs(htmlNode: HtmlNode, context: ITsHtmlExtensionCompletionContext): CompletionEntry[] | undefined {
		const builtInAttrNames = getBuiltInAttrsForTag(htmlNode.tagName);
		const unusedBuiltAttrNames = builtInAttrNames.filter(attrName => !htmlNode.attributes.map(attr => attr.name).includes(attrName.toLowerCase()));
		return unusedBuiltAttrNames.map(
			attrName =>
				({
					name: attrName,
					insertText: attrName,
					kind: ScriptElementKind.label,
					sortText: "1"
				} as CompletionEntry)
		);
	}

	/**
	 * Returns completions for built in html nodes.
	 * @param position
	 * @param leftWord
	 * @param rightWord
	 * @param store
	 */
	completionsForHtmlNodes({ position, leftWord, rightWord, store }: ITsHtmlExtensionCompletionContext): CompletionEntry[] | undefined {
		return [...getBuiltInTags(), ...store.config.externalTagNames].map(
			tagName =>
				({
					name: tagName,
					insertText: tagName,
					kind: ScriptElementKind.label,
					sortText: "1",
					replacementSpan: {
						start: position - leftWord.length,
						length: leftWord.length + rightWord.length
					}
				} as CompletionEntry)
		);
	}

	/**
	 * Returns quick info for a built in html node.
	 * @param htmlNode
	 * @param context
	 */
	quickInfoForHtmlNode(htmlNode: HtmlNode, context: ITsHtmlExtensionQuickInfoContext): QuickInfo | undefined {
		const { start, end } = htmlNode.location.name;

		switch (htmlNode.kind) {
			case HtmlNodeKind.BUILT_IN:
				const description = getDescriptionForBuiltInTag(htmlNode.tagName);

				return {
					kind: ScriptElementKind.memberVariableElement,
					kindModifiers: "",
					textSpan: { start, length: end - start },
					displayParts: [{ text: "<", kind: "punctuation" }, { text: htmlNode.tagName || "unknown", kind: "text" }, { text: ">", kind: "punctuation" }],
					documentation:
						description == null
							? []
							: [
									{
										kind: "text",
										text: description
									}
							  ]
				};
		}
	}

	/**
	 * Returns quick info for a built in html attribute.
	 * @param htmlAttr
	 * @param context
	 */
	quickInfoForHtmlAttr(htmlAttr: HtmlAttr, context: ITsHtmlExtensionQuickInfoContext): QuickInfo | undefined {
		const { start, end } = htmlAttr.location.name;

		switch (htmlAttr.kind) {
			case HtmlAttrKind.BUILT_IN:
				const description = getDescriptionForBuiltInAttr(htmlAttr.name);

				return {
					kind: ScriptElementKind.memberVariableElement,
					kindModifiers: "",
					textSpan: { start, length: end - start },
					displayParts: [{ text: "(", kind: "punctuation" }, { text: "attribute", kind: "text" }, { text: ")", kind: "punctuation" }],
					documentation:
						description == null
							? []
							: [
									{
										kind: "text",
										text: description
									}
							  ]
				};
		}
	}

	/**
	 * Returns diagnostics for built in html attributes.
	 * @param htmlAttr
	 * @param htmlReport
	 * @param file
	 * @param store
	 */
	diagnosticsForHtmlAttr(htmlAttr: HtmlAttr, htmlReport: VanillaHtmlReport, { file, store }: ITsHtmlExtensionDiagnosticContext): DiagnosticWithLocation[] {
		const { start, end } = htmlAttr.location.name;

		const messageText = (() => {
			switch (htmlReport.kind) {
				case VanillaHtmlReportKind.HTML_INVALID_ATTRIBUTE_EXPRESSION_TYPE:
					if (!htmlReport.typeAPrimitive && !htmlReport.typeBPrimitive) {
						return `Non-primitive type '${htmlReport.typeB}' cannot be assigned to non-primitive type '${htmlReport.typeA}'.`;
					} else if (!htmlReport.typeAPrimitive) {
						return `Type '${htmlReport.typeB}' is not assignable to non-primitive type '${htmlReport.typeA}'`;
					} else if (!htmlReport.typeBPrimitive) {
						return `Non-primitive type '${htmlReport.typeB}' is not assignable to '${htmlReport.typeA}'`;
					} else {
						return `Type '${htmlReport.typeB}' is not assignable to '${htmlReport.typeA}'`;
					}
					break;
			}
		})();

		return messageText == null
			? []
			: [
					{
						file,
						start,
						length: end - start,
						messageText,
						category: store.ts.DiagnosticCategory.Error,
						source: DIAGNOSTIC_SOURCE,
						code: 2322
					}
			  ];
	}

	/**
	 * Parse built in html tags.
	 * @param p5Node
	 * @param store
	 * @param htmlNodeBase
	 */
	parseHtmlNode(p5Node: IP5TagNode, { store, htmlNodeBase }: ITsHtmlExtensionParseHtmlNodeContext): IHtmlNodeBuiltIn | undefined {
		if (isBuiltInTag(p5Node.tagName)) {
			// For now: opt out of svg and style children tags
			// TODO: Handle svg and style tags
			const isBlacklisted = ["svg", "style"].includes(p5Node.tagName);

			return {
				...htmlNodeBase,
				kind: HtmlNodeKind.BUILT_IN,
				childNodes: isBlacklisted ? [] : htmlNodeBase.childNodes
			};
		}
	}

	/**
	 * Parse built in html attributes.
	 * @param p5Attr
	 * @param htmlNode
	 * @param htmlAttrBase
	 * @param p5Node
	 */
	parseHtmlAttr(p5Attr: IP5NodeAttr, htmlNode: HtmlNode, { htmlAttrBase, p5Node }: ITsHtmlExtensionParseAttrContext): IHtmlAttrBuiltIn | undefined {
		const { name } = htmlAttrBase;

		// For now, pick up attributes that starts with "on".
		// They will become "any" because we don't manage types for built in events right now. (basically op out of type checking).
		// TODO: Handle events.
		if (isBuiltInAttrForTag(p5Node.tagName, name) || name.startsWith("on")) {
			return {
				kind: HtmlAttrKind.BUILT_IN,
				...htmlAttrBase
			};
		}
	}

	/**
	 * Parse attribute assignments for built in attributes.
	 * @param htmlAttr
	 * @param assignmentBase
	 */
	parseHtmlAttrAssignment(htmlAttr: HtmlAttr, { assignmentBase }: ITsHtmlExtensionParseAttrAssignmentContext): IHtmlAttrAssignment | undefined {
		if (htmlAttr.kind !== HtmlAttrKind.BUILT_IN) return;

		return {
			...assignmentBase,
			typeA: getBuiltInAttributeType(htmlAttr.name) || TypeKind.ANY
		};
	}

	/**
	 * Validates attribute assignment using basic html rules.
	 * Eg. assigning an object becomes "[Object object]"
	 * @param htmlAttr
	 * @param isAssignableToValue
	 * @param getTypeString
	 * @param isAssignableTo
	 * @param isAssignableToPrimitive
	 */
	validateHtmlAttrAssignment(
		htmlAttr: HtmlAttr,
		{ isAssignableToValue, getTypeString, isAssignableTo, isAssignableToPrimitive }: ITsHtmlExtensionValidateExpressionContext
	): VanillaHtmlReport[] | undefined {
		if (htmlAttr.assignment == null) return;

		const {
			assignment: { typeA, typeB }
		} = htmlAttr;

		const typeAPrimitive = isAssignableToPrimitive(typeA);
		const typeBPrimitive = isAssignableToPrimitive(typeB);

		if (!typeAPrimitive || !typeBPrimitive || !isAssignableTo(typeA, typeB)) {
			return [
				{
					kind: VanillaHtmlReportKind.HTML_INVALID_ATTRIBUTE_EXPRESSION_TYPE,
					typeAPrimitive,
					typeBPrimitive,
					typeA: getTypeString(typeA),
					typeB: getTypeString(typeB)
				}
			];
		}
	}
}
