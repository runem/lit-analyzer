import { SimpleTypeKind } from "ts-simple-type";
import { CodeFixAction, DiagnosticWithLocation } from "typescript";
import { IP5NodeAttr, IP5TagNode } from "../html-document/parse-html-p5/parse-html-types";
import { IHtmlAttrAssignment } from "../html-document/types/html-attr-assignment-types";
import { HtmlAttr, HtmlAttrKind, IHtmlAttrUnknown } from "../html-document/types/html-attr-types";
import { HtmlNode, HtmlNodeKind, IHtmlNodeUnknown } from "../html-document/types/html-node-types";
import { HtmlReport, HtmlReportKind } from "../html-document/types/html-report-types";
import { findBestMatch } from "../util/find-best-match";
import { getBuiltInAttrsForTag } from "../util/html-documentation";
import { rangeToTSSpan } from "../util/util";
import {
	ITsHtmlExtension,
	ITsHtmlExtensionCodeFixContext,
	ITsHtmlExtensionDiagnosticContext,
	ITsHtmlExtensionParseAttrAssignmentContext,
	ITsHtmlExtensionParseAttrContext,
	ITsHtmlExtensionParseHtmlNodeContext,
	ITsHtmlExtensionValidateContext
} from "./i-ts-html-extension";

/**
 * A extension that handles unknown elements.
 * This extension basically consists of fallback methods when no other extension picked up on a given node.
 */
export class UnknownElementExtension implements ITsHtmlExtension {
	/**
	 * Returns code fixes for unknown elements.
	 * @param htmlNode
	 * @param htmlReport
	 * @param context
	 */
	codeFixesForHtmlNodeReport(htmlNode: HtmlNode, htmlReport: HtmlReport, context: ITsHtmlExtensionCodeFixContext): CodeFixAction[] | undefined {
		switch (htmlReport.kind) {
			case HtmlReportKind.UNKNOWN:
				if (htmlReport.suggestedName == null) break;

				return [
					{
						fixName: "rename",
						description: `Change spelling to '${htmlReport.suggestedName}'`,
						changes: [
							{
								fileName: context.file.fileName,
								textChanges: [
									{
										span: rangeToTSSpan(htmlNode.location.name),
										newText: htmlReport.suggestedName
									}
								]
							}
						]
					}
				];
		}
	}

	/**
	 * Returns code fixes for unknown html attributes.
	 * @param htmlAttr
	 * @param htmlReport
	 * @param context
	 */
	codeFixesForHtmlAttrReport(htmlAttr: HtmlAttr, htmlReport: HtmlReport, context: ITsHtmlExtensionCodeFixContext): CodeFixAction[] | undefined {
		switch (htmlReport.kind) {
			case HtmlReportKind.UNKNOWN:
				if (htmlReport.suggestedName == null) break;

				return [
					{
						fixName: "rename",
						description: `Change spelling to '${htmlReport.suggestedName}'`,
						changes: [
							{
								fileName: context.file.fileName,
								textChanges: [
									{
										span: rangeToTSSpan(htmlAttr.location.name),
										newText: htmlReport.suggestedName
									}
								]
							}
						]
					}
				];
		}
	}

	/**
	 * Returns diagnostics for unknown html nodes.
	 * @param htmlNode
	 * @param htmlReport
	 * @param file
	 * @param ts
	 */
	diagnosticsForHtmlNodeReport(htmlNode: HtmlNode, htmlReport: HtmlReport, { file, store: { ts } }: ITsHtmlExtensionDiagnosticContext): DiagnosticWithLocation[] {
		const diagnostics: DiagnosticWithLocation[] = [];

		switch (htmlReport.kind) {
			case HtmlReportKind.UNKNOWN:
				const messageText = `Unknown tag "${htmlNode.tagName}"${htmlReport.suggestedName ? `. Did you mean '${htmlReport.suggestedName}'?` : ""}`;

				return [
					{
						...rangeToTSSpan(htmlNode.location.name),
						file,
						messageText,
						category: ts.DiagnosticCategory.Error,
						source: "tagged-html",
						code: 2322
					}
				];
		}

		return diagnostics;
	}

	/**
	 * Returns diagnostics for built in html attributes.
	 * @param htmlAttr
	 * @param htmlReport
	 * @param file
	 * @param store
	 */
	diagnosticsForHtmlAttrReport(htmlAttr: HtmlAttr, htmlReport: HtmlReport, { file, store }: ITsHtmlExtensionDiagnosticContext): DiagnosticWithLocation[] {
		const diagnostics: DiagnosticWithLocation[] = [];

		switch (htmlReport.kind) {
			case HtmlReportKind.UNKNOWN:
				// Don't report unknown attributes on unknown elements
				if (store.config.externalTagNames.includes(htmlAttr.htmlNode.tagName)) return [];

				const messageText = `Unknown attribute "${htmlAttr.name}"${htmlReport.suggestedName ? `. Did you mean '${htmlReport.suggestedName}'?` : ""}`;

				return [
					{
						...rangeToTSSpan(htmlAttr.location.name),
						file,
						messageText,
						category: store.ts.DiagnosticCategory.Error,
						source: "tagged-html",
						code: 2322
					}
				];
		}

		return diagnostics;
	}

	/**
	 * Returns html reports for unknown html attributes.
	 * @param htmlNode
	 * @param context
	 */
	validateHtmlNode(htmlNode: HtmlNode, context: ITsHtmlExtensionValidateContext): HtmlReport[] | undefined {
		const { store } = context;

		switch (htmlNode.kind) {
			case HtmlNodeKind.UNKNOWN:
				if (store.config.externalTagNames.includes(htmlNode.tagName)) return [];

				const suggestedName = findBestMatch(htmlNode.tagName, [...Array.from(store.allComponents.keys()), ...store.config.externalTagNames]);

				return [
					{
						kind: HtmlReportKind.UNKNOWN,
						suggestedName
					}
				];
		}
	}

	/**
	 * Returns html reports for unknown html attributes.
	 * @param htmlAttr
	 * @param context
	 */
	validateHtmlAttr(htmlAttr: HtmlAttr, context: ITsHtmlExtensionDiagnosticContext): HtmlReport[] | undefined {
		const { store } = context;

		const element = (() => {
			const htmlNode = htmlAttr.htmlNode as HtmlNode;
			return htmlNode.kind === HtmlNodeKind.COMPONENT ? htmlNode.component : undefined;
		})();

		switch (htmlAttr.kind) {
			case HtmlAttrKind.UNKNOWN:
				// Ignore unknown "data-" attributes
				if (htmlAttr.name.startsWith("data-")) return [];

				// Don't report unknown attributes on unknown elements
				if (store.config.externalTagNames.includes(htmlAttr.htmlNode.tagName)) return [];

				const suggestedName = findBestMatch(htmlAttr.name, [...(element ? element.props.map(p => p.name) : []), ...getBuiltInAttrsForTag(htmlAttr.htmlNode.tagName)]);

				return [
					{
						kind: HtmlReportKind.UNKNOWN,
						suggestedName
					}
				];
		}
	}

	/**
	 * Parses an unknown html node.
	 * @param p5Node
	 * @param store
	 * @param htmlNodeBase
	 */
	parseHtmlNode(p5Node: IP5TagNode, { store, htmlNodeBase }: ITsHtmlExtensionParseHtmlNodeContext): IHtmlNodeUnknown | undefined {
		return {
			kind: HtmlNodeKind.UNKNOWN,
			...htmlNodeBase
		};
	}

	/**
	 * Parses an unknown html attribute.
	 * @param p5Attr
	 * @param htmlNode
	 * @param htmlAttrBase
	 */
	parseHtmlAttr(p5Attr: IP5NodeAttr, htmlNode: HtmlNode, { htmlAttrBase }: ITsHtmlExtensionParseAttrContext): IHtmlAttrUnknown | undefined {
		return {
			kind: HtmlAttrKind.UNKNOWN,
			...htmlAttrBase
		};
	}

	/**
	 * Parses an unknown html attribute assignment.
	 * @param htmlAttr
	 * @param assignmentBase
	 */
	parseHtmlAttrAssignment(htmlAttr: HtmlAttr, { assignmentBase }: ITsHtmlExtensionParseAttrAssignmentContext): IHtmlAttrAssignment | undefined {
		return {
			typeA: { kind: SimpleTypeKind.ANY },
			...assignmentBase
		};
	}
}
