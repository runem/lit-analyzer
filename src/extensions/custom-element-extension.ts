import { basename, dirname, relative } from "path";
import { CodeFixAction, CompletionEntry, DefinitionInfoAndBoundSpan, DiagnosticWithLocation, Node, QuickInfo, ScriptElementKind, SourceFile } from "typescript";
import { IP5NodeAttr, IP5TagNode } from "../html-document/parse-html-p5/parse-html-types";
import { IHtmlAttrAssignment } from "../html-document/types/html-attr-assignment-types";
import { HtmlAttr, HtmlAttrKind, IHtmlAttrCustomProp } from "../html-document/types/html-attr-types";
import { HtmlNode, HtmlNodeKind, IHtmlNodeCustomElement } from "../html-document/types/html-node-types";
import { HtmlReport, HtmlReportKind } from "../html-document/types/html-report-types";
import { caseInsensitiveCmp } from "../util/util";
import {
	ITsHtmlExtension,
	ITsHtmlExtensionCodeFixContext,
	ITsHtmlExtensionCompletionContext,
	ITsHtmlExtensionDefinitionAndBoundSpanContext,
	ITsHtmlExtensionDiagnosticContext,
	ITsHtmlExtensionParseAttrAssignmentContext,
	ITsHtmlExtensionParseAttrContext,
	ITsHtmlExtensionParseHtmlNodeContext,
	ITsHtmlExtensionQuickInfoContext,
	ITsHtmlExtensionValidateContext
} from "./i-ts-html-extension";

const DIAGNOSTIC_SOURCE = "tagged-html";

/**
 * An extension that adds custom element capabilities to the ts-html plugin.
 */
export class CustomElementExtension implements ITsHtmlExtension {
	/**
	 * Returns completions for custom element attributes.
	 * @param htmlNode
	 * @param context
	 */
	completionsForHtmlAttrs(htmlNode: HtmlNode, context: ITsHtmlExtensionCompletionContext): CompletionEntry[] | undefined {
		if (htmlNode.kind === HtmlNodeKind.COMPONENT) {
			const props = htmlNode.component.props;
			const unusedProps = props.filter(prop => !(htmlNode.attributes.find(attr => caseInsensitiveCmp(prop.name, attr.name)) != null));
			return unusedProps.map(prop => ({
				name: `${prop.name}${prop.required ? "" : "?"}`,
				insertText: prop.name,
				kind: ScriptElementKind.memberVariableElement,
				sortText: "0"
			}));
		}

		return [];
	}

	/**
	 * Returns completions for custom elements.
	 * @param position
	 * @param leftWord
	 * @param rightWord
	 * @param store
	 */
	completionsForHtmlNodes({ position, leftWord, rightWord, store }: ITsHtmlExtensionCompletionContext): CompletionEntry[] | undefined {
		const customElements = Array.from(store.allComponents.keys());

		return customElements.map(
			tagName =>
				({
					name: tagName,
					insertText: tagName,
					kind: ScriptElementKind.memberVariableElement,
					sortText: "0",
					replacementSpan: {
						start: position - leftWord.length,
						length: leftWord.length + rightWord.length
					}
				} as CompletionEntry)
		);
	}

	/**
	 * Returns goto definition for a custom element html node.
	 * @param htmlNode
	 * @param context
	 */
	definitionAndBoundSpanForHtmlNode(htmlNode: HtmlNode, context: ITsHtmlExtensionDefinitionAndBoundSpanContext): DefinitionInfoAndBoundSpan | undefined {
		const { start: sourceStart, end: sourceEnd } = htmlNode.location.name;

		switch (htmlNode.kind) {
			case HtmlNodeKind.COMPONENT:
				const { start: targetStart, end: targetEnd } = htmlNode.component.location;

				return {
					definitions: [
						{
							name: htmlNode.component.meta.className || "",
							textSpan: {
								start: targetStart,
								length: targetEnd - targetStart
							},
							fileName: htmlNode.component.fileName,
							containerName: htmlNode.component.fileName,
							kind: ScriptElementKind.classElement,
							containerKind: ScriptElementKind.functionElement
						}
					],
					textSpan: {
						start: sourceStart,
						length: sourceEnd - sourceStart
					}
				};
		}
	}

	/**
	 * Returns goto definitions for a custom element attribute.
	 * @param htmlAttr
	 * @param context
	 */
	definitionAndBoundSpanForHtmlAttr(htmlAttr: HtmlAttr, context: ITsHtmlExtensionDefinitionAndBoundSpanContext): DefinitionInfoAndBoundSpan | undefined {
		const { start: sourceStart, end: sourceEnd } = htmlAttr.location.name;

		switch (htmlAttr.kind) {
			case HtmlAttrKind.CUSTOM_PROP:
				const { start: targetStart, end: targetEnd } = htmlAttr.prop.location;
				return {
					definitions: [
						{
							name: htmlAttr.component.meta.className || "",
							textSpan: {
								start: targetStart,
								length: targetEnd - targetStart
							},
							fileName: htmlAttr.component.fileName,
							containerName: htmlAttr.component.fileName,
							kind: ScriptElementKind.memberVariableElement,
							containerKind: ScriptElementKind.functionElement
						}
					],
					textSpan: {
						start: sourceStart,
						length: sourceEnd - sourceStart
					}
				};
		}
	}

	/**
	 * Returns quick info for a custom element.
	 * @param htmlNode
	 * @param context
	 */
	quickInfoForHtmlNode(htmlNode: HtmlNode, context: ITsHtmlExtensionQuickInfoContext): QuickInfo | undefined {
		const { start, end } = htmlNode.location.name;

		switch (htmlNode.kind) {
			case HtmlNodeKind.COMPONENT:
				return {
					kind: ScriptElementKind.memberVariableElement,
					kindModifiers: "",
					textSpan: { start, length: end - start },
					displayParts: [
						{ text: "<", kind: "punctuation" },
						{ text: htmlNode.tagName || "unknown", kind: "text" },
						{ text: ">", kind: "punctuation" },
						{ text: ":", kind: "punctuation" },
						{ text: " ", kind: "space" },
						{ text: "class", kind: "keyword" },
						{ text: " ", kind: "space" },
						{ text: htmlNode.component.meta.className || "", kind: "className" }
					],
					documentation: (() => {
						const jsDoc = htmlNode.component.meta.jsDoc;
						return jsDoc == null || jsDoc.comment == null ? [] : [{ kind: "text", text: jsDoc.comment }];
					})()
				};
		}
	}

	/**
	 * Returns quick info for a custom element attribute.
	 * @param htmlAttr
	 * @param context
	 */
	quickInfoForHtmlAttr(htmlAttr: HtmlAttr, context: ITsHtmlExtensionQuickInfoContext): QuickInfo | undefined {
		const { start, end } = htmlAttr.location.name;

		switch (htmlAttr.kind) {
			case HtmlAttrKind.CUSTOM_PROP:
				if ((htmlAttr.htmlNode as HtmlNode).kind !== HtmlNodeKind.COMPONENT) break;

				return {
					kind: ScriptElementKind.memberVariableElement,
					kindModifiers: "",
					textSpan: { start, length: end - start },
					displayParts: [
						{ text: "(", kind: "punctuation" },
						{ text: "property", kind: "text" },
						{ text: ")", kind: "punctuation" },
						{ text: " ", kind: "space" },
						{ text: htmlAttr.component.meta.className || "", kind: "className" },
						{ text: ".", kind: "punctuation" },
						{ text: htmlAttr.name, kind: "propertyName" },
						{ text: ":", kind: "punctuation" },
						{ text: " ", kind: "space" },
						{ text: context.checker.typeToString(htmlAttr.prop.type), kind: "keyword" }
					],
					documentation: (() => {
						const jsDoc = htmlAttr.prop.jsDoc;
						return jsDoc == null || jsDoc.comment == null ? [] : [{ kind: "text", text: jsDoc.comment }];
					})()
				};
		}
	}

	/**
	 * Returns code fixes for a custom element.
	 * @param htmlNode
	 * @param htmlReport
	 * @param store
	 * @param file
	 */
	codeFixesForHtmlNodeReport(htmlNode: HtmlNode, htmlReport: HtmlReport, { store, file }: ITsHtmlExtensionCodeFixContext): CodeFixAction[] | undefined {
		switch (htmlReport.kind) {
			case HtmlReportKind.MISSING_IMPORT:
				if (htmlNode.kind !== HtmlNodeKind.COMPONENT) break;

				// Find our where the tag can be found
				const targetFileName = store.allTagNameFileNames.get(htmlNode.tagName);
				if (targetFileName == null) break;

				// Get the import path and the position where it can be placed
				const importPath = getRelativePathForImport(file.fileName, targetFileName);
				const lastImportIndex = getLastImportIndex(file, store.ts.isImportDeclaration);

				return [
					{
						fixName: `import`,
						description: `Import "${htmlNode.component.meta.className}" from module "${importPath}"`,
						changes: [
							{
								fileName: file.fileName,
								textChanges: [
									{
										span: { start: lastImportIndex, length: 0 },
										newText: `\nimport "${importPath}";`
									}
								]
							}
						]
					}
				];
		}
	}

	/**
	 * Returns diagnostics for a custom element html node.
	 * @param htmlNode
	 * @param htmlReport
	 * @param file
	 */
	diagnosticsForHtmlNodeReport(htmlNode: HtmlNode, htmlReport: HtmlReport, { file, store: { ts } }: ITsHtmlExtensionDiagnosticContext): DiagnosticWithLocation[] {
		const { start, end } = htmlNode.location.name;
		const diagnostics: DiagnosticWithLocation[] = [];

		switch (htmlReport.kind) {
			case HtmlReportKind.MISSING_PROPS:
				diagnostics.push({
					file,
					start,
					length: end - start,
					messageText: `Missing required properties: ${htmlReport.props.map(p => `${p.name}`).join(", ")}`,
					category: ts.DiagnosticCategory.Error,
					source: DIAGNOSTIC_SOURCE,
					code: 2304 // Cannot find name
				});
				break;

			case HtmlReportKind.MISSING_IMPORT:
				if (htmlNode.kind === HtmlNodeKind.COMPONENT) {
					diagnostics.push({
						file,
						start,
						length: end - start,
						messageText: `Missing import <${htmlNode.tagName}>: ${htmlNode.component.meta.className}`,
						category: ts.DiagnosticCategory.Error,
						source: DIAGNOSTIC_SOURCE,
						code: 2304 // Cannot find name
					});
				}
				break;
		}

		return diagnostics;
	}

	/**
	 * Parses a custom element tag.
	 * @param p5Node
	 * @param store
	 * @param htmlNodeBase
	 */
	parseHtmlNode(p5Node: IP5TagNode, { store, htmlNodeBase }: ITsHtmlExtensionParseHtmlNodeContext): IHtmlNodeCustomElement | undefined {
		const component = store.allComponents.get(p5Node.tagName);

		if (component != null) {
			return {
				...htmlNodeBase,
				kind: HtmlNodeKind.COMPONENT,
				component
			};
		}
	}

	/**
	 * Parses a custom element attribute.
	 * @param p5Attr
	 * @param htmlNode
	 * @param htmlAttrBase
	 */
	parseHtmlAttr(p5Attr: IP5NodeAttr, htmlNode: HtmlNode, { htmlAttrBase }: ITsHtmlExtensionParseAttrContext): IHtmlAttrCustomProp | undefined {
		if (htmlNode.kind !== HtmlNodeKind.COMPONENT) return;

		const { component } = htmlNode;
		const prop = component.props.find(p => caseInsensitiveCmp(p.name, htmlAttrBase.name));

		if (prop != null) {
			return {
				...htmlAttrBase,
				prop,
				component,
				kind: HtmlAttrKind.CUSTOM_PROP
			};
		}
	}

	/**
	 * Parses a custom element attribute assignment.
	 * @param htmlAttr
	 * @param assignmentBase
	 */
	parseHtmlAttrAssignment(htmlAttr: HtmlAttr, { assignmentBase }: ITsHtmlExtensionParseAttrAssignmentContext): IHtmlAttrAssignment | undefined {
		if (htmlAttr.kind !== HtmlAttrKind.CUSTOM_PROP) return;

		return {
			...assignmentBase,
			typeA: htmlAttr.prop.type
		};
	}

	/**
	 * Validates a custom element html node returning html reports for the element.
	 * @param htmlNode
	 * @param astNode
	 * @param store
	 */
	validateHtmlNode(htmlNode: HtmlNode, { file, store }: ITsHtmlExtensionValidateContext): HtmlReport[] | undefined {
		const reports: HtmlReport[] = [];

		switch (htmlNode.kind) {
			case HtmlNodeKind.COMPONENT:
				// Find missing attributes on the node
				const attrs = htmlNode.attributes.map(a => a.name);
				const missingRequiredProps = htmlNode.component.props.filter(prop => prop.required).filter(prop => !attrs.includes(prop.name.toLowerCase()));

				// Add missing "missing props" report if necessary.
				if (missingRequiredProps.length > 0) {
					reports.push({
						kind: HtmlReportKind.MISSING_PROPS,
						props: missingRequiredProps
					});
				}

				// Check if this element is imported
				if (!store.config.ignoreImports) {
					const isDefinitionImported = store.hasTagNameBeenImported(file.fileName, htmlNode.tagName);

					if (!isDefinitionImported) {
						reports.push({ kind: HtmlReportKind.MISSING_IMPORT });
					}
				}
				break;
		}

		return reports;
	}
}

/**
 * Returns the position of the last import line.
 * @param sourceFile
 * @param isImportDeclaration
 */
function getLastImportIndex(sourceFile: SourceFile, isImportDeclaration: (node: Node) => boolean): number {
	let lastImportIndex = 0;

	for (const statement of sourceFile.statements) {
		if (isImportDeclaration(statement)) {
			lastImportIndex = statement.getEnd();
		}
	}

	return lastImportIndex;
}

/**
 * Returns a relative path from a file path to another file path.
 * This path can be used in an import statement.
 * @param fromFileName
 * @param toFileName
 */
function getRelativePathForImport(fromFileName: string, toFileName: string): string {
	const path = relative(dirname(fromFileName), dirname(toFileName));
	const filenameWithoutExt = basename(toFileName).replace(/\.[^/.]+$/, "");
	return `./${path ? `${path}/` : ""}${filenameWithoutExt}`;
}
