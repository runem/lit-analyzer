import { SimpleTypeKind } from "ts-simple-type";
import { CodeFixAction, DiagnosticWithLocation } from "typescript";
import { IP5NodeAttr, IP5TagNode } from "../parse-html-nodes/parse-html-p5/parse-html-types";
import { IHtmlAttrAssignment } from "../parse-html-nodes/types/html-attr-assignment-types";
import { HtmlAttr, HtmlAttrKind, IHtmlAttrUnknown } from "../parse-html-nodes/types/html-attr-types";
import { HtmlNode, HtmlNodeKind, IHtmlNodeUnknown } from "../parse-html-nodes/types/html-node-types";
import { HtmlReport, HtmlReportKind } from "../parse-html-nodes/types/html-report-types";
import { findBestMatch } from "../util/find-best-match";
import { getBuiltInAttrsForTag } from "../util/html-documentation";
import {
	ITsHtmlExtension,
	ITsHtmlExtensionCodeFixContext,
	ITsHtmlExtensionDiagnosticContext,
	ITsHtmlExtensionParseAttrAssignmentContext,
	ITsHtmlExtensionParseAttrContext,
	ITsHtmlExtensionParseHtmlNodeContext,
	ITsHtmlExtensionValidateContext
} from "./i-ts-html-extension";

const DIAGNOSTIC_SOURCE = "ts-html";

/**
 * A extension that handles unknown elements.
 * This extension basically consists of fallback methods when no other extension picked up on a given node.
 */
export class UnknownElementExtension implements ITsHtmlExtension {
	/**
	 * Returns code fixes for basic and unknown elements.
	 * @param htmlNode
	 * @param htmlReport
	 * @param context
	 */
	codeFixesForHtmlNode(htmlNode: HtmlNode, htmlReport: HtmlReport, context: ITsHtmlExtensionCodeFixContext): CodeFixAction[] | undefined {
		switch (htmlReport.kind) {
			case HtmlReportKind.UNKNOWN:
				if (htmlReport.suggestedName == null) break;

				return [
					renameCodeFixAction({
						fileName: context.file.fileName,
						...htmlNode.location.name,
						suggestedName: htmlReport.suggestedName
					})
				];
		}
	}

	/**
	 * Returns code fixes for a basic and unknown html attributes.
	 * @param htmlAttr
	 * @param htmlReport
	 * @param context
	 */
	codeFixesForHtmlAttr(htmlAttr: HtmlAttr, htmlReport: HtmlReport, context: ITsHtmlExtensionCodeFixContext): CodeFixAction[] | undefined {
		switch (htmlReport.kind) {
			case HtmlReportKind.UNKNOWN:
				if (htmlReport.suggestedName == null) break;

				return [
					renameCodeFixAction({
						fileName: context.file.fileName,
						...htmlAttr.location.name,
						suggestedName: htmlReport.suggestedName
					})
				];
		}
	}

	/**
	 * Returns diagnostics for basic and unknown html attributes.
	 * @param htmlAttr
	 * @param htmlReport
	 * @param file
	 * @param ts
	 */
	diagnosticsForHtmlNode(htmlAttr: HtmlNode, htmlReport: HtmlReport, { file, store: { ts } }: ITsHtmlExtensionDiagnosticContext): DiagnosticWithLocation[] {
		const { start, end } = htmlAttr.location.name;
		const diagnostics: DiagnosticWithLocation[] = [];

		switch (htmlReport.kind) {
			case HtmlReportKind.UNKNOWN:
				diagnostics.push({
					file,
					start,
					length: end - start,
					messageText: `Unknown tag "${htmlAttr.tagName}"${htmlReport.suggestedName ? `. Did you mean '${htmlReport.suggestedName}'?` : ""}`,
					category: ts.DiagnosticCategory.Error,
					source: DIAGNOSTIC_SOURCE,
					code: 2304 // Cannot find name
				});
				break;
		}

		return diagnostics;
	}

	/**
	 * Returns diagnostics for unknown and built in html attributes.
	 * @param htmlAttr
	 * @param htmlReport
	 * @param file
	 * @param store
	 */
	diagnosticsForHtmlAttr(htmlAttr: HtmlAttr, htmlReport: HtmlReport, { file, store }: ITsHtmlExtensionDiagnosticContext): DiagnosticWithLocation[] {
		const { start, end } = htmlAttr.location.name;
		const diagnostics: DiagnosticWithLocation[] = [];

		switch (htmlReport.kind) {
			case HtmlReportKind.UNKNOWN:
				// Don't report unknown attributes on unknown elements
				if (store.config.externalTagNames.includes(htmlAttr.htmlNode.tagName)) return [];

				diagnostics.push({
					file,
					start,
					length: end - start,
					messageText: `Unknown attribute "${htmlAttr.name}"${htmlReport.suggestedName ? `. Did you mean '${htmlReport.suggestedName}'?` : ""}`,
					category: store.ts.DiagnosticCategory.Error,
					source: DIAGNOSTIC_SOURCE,
					code: 2551 // Property doesn't exist.
				});
				break;
		}

		return diagnostics;
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

	/**
	 * Returns reports for a html node.
	 * @param htmlNode
	 * @param astNode
	 * @param store
	 */
	validateHtmlNode(htmlNode: HtmlNode, { astNode, store }: ITsHtmlExtensionValidateContext): HtmlReport[] | undefined {
		switch (htmlNode.kind) {
			case HtmlNodeKind.UNKNOWN:
				if (store.config.externalTagNames.includes(htmlNode.tagName)) return [];

				return [
					{
						kind: HtmlReportKind.UNKNOWN,
						suggestedName: findBestMatch(htmlNode.tagName, [...Array.from(store.allComponents.keys()), ...store.config.externalTagNames])
					}
				];
		}
	}

	/**
	 * Returns reports for a html attribute
	 * @param htmlAttr
	 * @param astNode
	 */
	validateHtmlAttr(htmlAttr: HtmlAttr, { astNode }: ITsHtmlExtensionValidateContext): HtmlReport[] | undefined {
		const element = (() => {
			const htmlNode = htmlAttr.htmlNode as HtmlNode;
			return htmlNode.kind === HtmlNodeKind.COMPONENT ? htmlNode.component : undefined;
		})();

		switch (htmlAttr.kind) {
			case HtmlAttrKind.UNKNOWN:
				// Ignore unknown "data-" attributes
				if (htmlAttr.name.startsWith("data-")) return [];

				return [
					{
						kind: HtmlReportKind.UNKNOWN,
						suggestedName: findBestMatch(htmlAttr.name, [...(element ? element.props.map(p => p.name) : []), ...getBuiltInAttrsForTag(htmlAttr.htmlNode.tagName)])
					}
				];
		}

		return [];
	}
}

/**
 * Returns a rename code fix action based on some metadata.
 * @param fileName
 * @param suggestedName
 * @param start
 * @param end
 */
function renameCodeFixAction({ fileName, suggestedName, start, end }: { suggestedName: string; fileName: string; start: number; end: number }): CodeFixAction {
	return {
		fixName: `rename`,
		description: `Change spelling to '${suggestedName}'`,
		changes: [
			{
				fileName,
				textChanges: [
					{
						span: { start, length: end - start },
						newText: suggestedName
					}
				]
			}
		]
	};
}
