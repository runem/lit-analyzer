import { DefinitionInfoAndBoundSpan, DiagnosticMessageChain, SourceFile } from "typescript";
import { DIAGNOSTIC_SOURCE } from "../constants";
import { parseDocumentsInSourceFile } from "../parsing/parse-documents-in-source-file";
import { CssDocument } from "../parsing/text-document/css-document/css-document";
import { HtmlDocument } from "../parsing/text-document/html-document/html-document";
import { TextDocument } from "../parsing/text-document/text-document";
import { tsModule } from "../ts-module";
import { Range } from "../types/range";
import { flatten } from "../util/util";
import { DiagnosticsContext } from "./diagnostics-context";
import { LitCssService } from "./lit-css/lit-css-service";
import { LitHtmlService } from "./lit-html/lit-html-service";
import { LitCodeFix } from "./types/lit-code-fix";
import { CodeActionKind, LitCodeFixAction } from "./types/lit-code-fix-action";
import { LitCompletion, LitCompletionKind } from "./types/lit-completion";
import { LitCompletionDetails } from "./types/lit-completion-details";
import { LitDefinition } from "./types/lit-definition";
import { LitDiagnostic } from "./types/lit-diagnostic";
import { LitFormatEdit } from "./types/lit-format-edit";
import { LitQuickInfo } from "./types/lit-quick-info";

function translateRange(range: Range, document: TextDocument): ts.TextSpan {
	const start = document.virtualDocument.offsetToSCPosition(range.start);
	const end = document.virtualDocument.offsetToSCPosition(range.end);

	return {
		start,
		length: end - start
	};
}

function translateCompletionKind(kind: LitCompletionKind): ts.ScriptElementKind {
	switch (kind) {
		case "memberFunctionElement":
			return tsModule.ts.ScriptElementKind.memberFunctionElement;
		case "functionElement":
			return tsModule.ts.ScriptElementKind.functionElement;
		case "constructorImplementationElement":
			return tsModule.ts.ScriptElementKind.constructorImplementationElement;
		case "variableElement":
			return tsModule.ts.ScriptElementKind.variableElement;
		case "classElement":
			return tsModule.ts.ScriptElementKind.classElement;
		case "interfaceElement":
			return tsModule.ts.ScriptElementKind.interfaceElement;
		case "moduleElement":
			return tsModule.ts.ScriptElementKind.moduleElement;
		case "memberVariableElement":
		case "member":
			return tsModule.ts.ScriptElementKind.memberVariableElement;
		case "constElement":
			return tsModule.ts.ScriptElementKind.constElement;
		case "enumElement":
			return tsModule.ts.ScriptElementKind.enumElement;
		case "keyword":
			return tsModule.ts.ScriptElementKind.keyword;
		case "alias":
			return tsModule.ts.ScriptElementKind.alias;
		case "label":
			return tsModule.ts.ScriptElementKind.label;
		default:
			return tsModule.ts.ScriptElementKind.unknown;
	}
}

function translateCompletion(completion: LitCompletion, document: TextDocument): ts.CompletionEntry {
	const { importance, kind, insert, name, range } = completion;

	return {
		name,
		kind: translateCompletionKind(kind),
		kindModifiers: completion.kindModifiers,
		sortText: importance === "high" ? "0" : importance === "medium" ? "1" : "2",
		insertText: insert,
		...(range != null ? { replacementSpan: translateRange(range, document) } : {})
	};
}

function translateCompletions(completions: LitCompletion[], document: TextDocument): ts.CompletionInfo | undefined {
	const entries = completions.map(completion => translateCompletion(completion, document));

	if (entries != null && entries.length > 0) {
		return {
			isGlobalCompletion: false,
			isMemberCompletion: false,
			isNewIdentifierLocation: false,
			entries
		};
	}
}

function translateCompletionDetails(completionDetails: LitCompletionDetails, document: TextDocument): ts.CompletionEntryDetails {
	return {
		name: completionDetails.name,
		kind: tsModule.ts.ScriptElementKind.label,
		kindModifiers: "",
		displayParts: [
			{
				text: completionDetails.primaryInfo,
				kind: "text"
			}
		],
		documentation:
			completionDetails.secondaryInfo == null
				? []
				: [
						{
							kind: "text",
							text: completionDetails.secondaryInfo
						}
				  ]
	};
}

function translateDiagnostic(report: LitDiagnostic, file: SourceFile, document: CssDocument, tips?: boolean): ts.DiagnosticWithLocation {
	const span = translateRange(report.location, document);

	const category = report.severity === "error" ? tsModule.ts.DiagnosticCategory.Error : tsModule.ts.DiagnosticCategory.Warning;
	const code = 2322;
	const messageText: string | DiagnosticMessageChain =
		tips && report.tip
			? {
					messageText: report.message,
					code,
					category,
					next: {
						messageText: report.tip,
						code: 0,
						category: tsModule.ts.DiagnosticCategory.Suggestion
					}
			  }
			: report.message;

	return {
		...span,
		file,
		messageText,
		category,
		code,
		source: DIAGNOSTIC_SOURCE
	};
}

function translateDiagnostics(reports: LitDiagnostic[], file: SourceFile, document: CssDocument, tips?: boolean): ts.DiagnosticWithLocation[] {
	return reports.map(report => translateDiagnostic(report, file, document, tips));
}

function translateDefinition(definition: LitDefinition, document: CssDocument): DefinitionInfoAndBoundSpan {
	const targetNode = definition.target.node;

	const targetStart = targetNode.getStart();
	const targetEnd = targetNode.getEnd();
	const targetFileName = targetNode.getSourceFile().fileName;
	const target = definition.target;

	return {
		definitions: [
			{
				name: ("name" in target && target.name) || ("propName" in target && target.propName) || ("attrName" in target && target.attrName) || "",
				textSpan: {
					start: targetStart,
					length: targetEnd - targetStart
				},
				fileName: targetFileName,
				containerName: targetFileName,
				kind: tsModule.ts.ScriptElementKind.memberVariableElement,
				containerKind: tsModule.ts.ScriptElementKind.functionElement
			}
		],
		textSpan: translateRange(definition.fromRange, document)
	};
}

function translateCodeFixAction(file: SourceFile, document: HtmlDocument, action: LitCodeFixAction): ts.FileTextChanges {
	switch (action.kind) {
		case CodeActionKind.DOCUMENT_TEXT_CHANGE:
			return {
				fileName: file.fileName,
				textChanges: [
					{
						span: translateRange(action.change.range, document),
						newText: action.change.newText
					}
				]
			};
		case CodeActionKind.IMPORT_COMPONENT:
			// Get the import path and the position where it can be placed
			const lastImportIndex = getLastImportIndex(file);

			return {
				fileName: file.fileName,
				textChanges: [
					{
						span: { start: lastImportIndex, length: 0 },
						newText: `\nimport "${action.importPath}";`
					}
				]
			};
	}
}

function translateCodeFix(file: SourceFile, document: HtmlDocument, codeFix: LitCodeFix): ts.CodeFixAction {
	return {
		fixName: codeFix.kind.toLowerCase(),
		description: codeFix.message,
		changes: codeFix.actions.map(action => translateCodeFixAction(file, document, action))
	};
}

function translateQuickInfo(quickInfo: LitQuickInfo, document: TextDocument): ts.QuickInfo {
	return {
		kind: tsModule.ts.ScriptElementKind.label,
		kindModifiers: "",
		textSpan: translateRange(quickInfo.range, document),
		displayParts: [
			{
				text: quickInfo.primaryInfo,
				kind: "text"
			}
		],
		documentation:
			quickInfo.secondaryInfo == null
				? []
				: [
						{
							kind: "text",
							text: quickInfo.secondaryInfo
						}
				  ]
	};
}

function translateFormatEdit(document: HtmlDocument, formatEdit: LitFormatEdit): ts.TextChange {
	return {
		newText: formatEdit.newText,
		span: translateRange(formatEdit.range, document)
	};
}

function translateFormatEdits(document: HtmlDocument, formatEdits: LitFormatEdit[]): ts.TextChange[] {
	return formatEdits.map(formatEdit => translateFormatEdit(document, formatEdit));
}

/**
 * Returns the position of the last import line.
 * @param sourceFile
 */
function getLastImportIndex(sourceFile: SourceFile): number {
	let lastImportIndex = 0;

	for (const statement of sourceFile.statements) {
		if (tsModule.ts.isImportDeclaration(statement)) {
			lastImportIndex = statement.getEnd();
		}
	}

	return lastImportIndex;
}

function translateCodeFixes(codeFixes: LitCodeFix[], file: SourceFile, document: HtmlDocument): ts.CodeFixAction[] {
	return codeFixes.map(codeFix => translateCodeFix(file, document, codeFix));
}

export class LitTsService {
	private litHtmlService = new LitHtmlService();
	private litCssService = new LitCssService();

	getCompletionDetails(file: SourceFile, position: number, name: string, context: DiagnosticsContext): ts.CompletionEntryDetails | undefined {
		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position, context);

		if (document instanceof CssDocument) {
			const result = this.litCssService.getCompletionDetails(document, offset, name, context);
			if (result == null) return undefined;
			return translateCompletionDetails(result, document);
		} else if (document instanceof HtmlDocument) {
			const result = this.litHtmlService.getCompletionDetails(document, offset, name, context);
			if (result == null) return undefined;
			return translateCompletionDetails(result, document);
		}
	}

	getCompletions(file: SourceFile, position: number, context: DiagnosticsContext): ts.CompletionInfo | undefined {
		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position, context);

		if (document instanceof CssDocument) {
			const results = this.litCssService.getCompletions(document, offset, context);
			return translateCompletions(results, document);
		} else if (document instanceof HtmlDocument) {
			const results = this.litHtmlService.getCompletions(document, offset, context);
			return translateCompletions(results, document);
		}
	}

	getDiagnostics(file: SourceFile, context: DiagnosticsContext): ts.DiagnosticWithLocation[] {
		const documents = this.getDocumentsInFile(file, context);

		return flatten(
			documents.map(document => {
				if (document instanceof CssDocument) {
					const results = this.litCssService.getDiagnostics(document, context);
					return translateDiagnostics(results, context.sourceFile, document);
				} else if (document instanceof HtmlDocument) {
					const results = this.litHtmlService.getDiagnostics(document, context);
					return translateDiagnostics(results, context.sourceFile, document, !context.store.config.noTips);
				}

				return [];
			})
		);
	}

	getDefinition(file: SourceFile, position: number, context: DiagnosticsContext): ts.DefinitionInfoAndBoundSpan | undefined {
		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position, context);
		if (document == null) return undefined;

		if (document instanceof CssDocument) {
			const result = this.litCssService.getDefinition(document, offset, context);
			if (result == null) return undefined;

			return translateDefinition(result, document);
		} else if (document instanceof HtmlDocument) {
			const result = this.litHtmlService.getDefinition(document, offset, context);
			if (result == null) return undefined;

			return translateDefinition(result, document);
		}
	}

	getCodeFixes(file: SourceFile, positionRange: Range, context: DiagnosticsContext): ts.CodeFixAction[] {
		const { document } = this.getDocumentAndOffsetAtPosition(file, positionRange.start, context);
		if (document == null) return [];

		const offsetRange: Range = {
			start: document.virtualDocument.scPositionToOffset(positionRange.start),
			end: document.virtualDocument.scPositionToOffset(positionRange.end)
		};

		if (document instanceof HtmlDocument) {
			const results = this.litHtmlService.getCodeFixes(document, offsetRange, context);
			return translateCodeFixes(results, context.sourceFile, document);
		}

		return [];
	}

	getQuickInfo(file: SourceFile, position: number, context: DiagnosticsContext): ts.QuickInfo | undefined {
		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position, context);
		if (document == null) return undefined;

		if (document instanceof CssDocument) {
			const result = this.litCssService.getQuickInfo(document, offset, context);
			if (result == null) return undefined;

			return translateQuickInfo(result, document);
		} else if (document instanceof HtmlDocument) {
			const result = this.litHtmlService.getQuickInfo(document, offset, context);
			if (result == null) return undefined;

			return translateQuickInfo(result, document);
		}
	}

	getClosingTag(file: SourceFile, position: number, context: DiagnosticsContext): ts.JsxClosingTagInfo | undefined {
		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position, context);
		if (document == null) return undefined;

		if (document instanceof HtmlDocument) {
			const newText = this.litHtmlService.doTagComplete(document, offset);
			if (newText == null) return undefined;
			return { newText };
		}
	}

	format(file: SourceFile, settings: ts.FormatCodeSettings, context: DiagnosticsContext): ts.TextChange[] {
		const documents = this.getDocumentsInFile(file, context);

		return flatten(
			documents.map(document => {
				if (document instanceof CssDocument) {
					return [];
				} else if (document instanceof HtmlDocument) {
					const results = this.litHtmlService.format(document, settings);
					return translateFormatEdits(document, results);
				}

				return [];
			})
		);
	}

	private getDocumentAndOffsetAtPosition(sourceFile: SourceFile, position: number, context: DiagnosticsContext): { document: TextDocument | undefined; offset: number } {
		const document = parseDocumentsInSourceFile(
			sourceFile,
			{
				htmlTags: context.store.config.htmlTemplateTags,
				cssTags: context.store.config.cssTemplateTags
			},
			position
		);

		return {
			document,
			offset: document != null ? document.virtualDocument.scPositionToOffset(position) : -1
		};
	}

	private getDocumentsInFile(sourceFile: SourceFile, context: DiagnosticsContext): TextDocument[] {
		return parseDocumentsInSourceFile(sourceFile, {
			htmlTags: context.store.config.htmlTemplateTags,
			cssTags: context.store.config.cssTemplateTags
		});
	}
}
