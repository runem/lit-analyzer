import { SourceFile } from "typescript";
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
import { LitCompletion } from "./types/lit-completion";
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

function translateCompletion(completion: LitCompletion, document: TextDocument): ts.CompletionEntry {
	const { importance, kind, insert, name, range } = completion;

	return {
		name,
		kind: kind === "member" ? tsModule.ts.ScriptElementKind.memberVariableElement : tsModule.ts.ScriptElementKind.label,
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

function translateDiagnostic(report: LitDiagnostic, file: SourceFile, document: CssDocument): ts.DiagnosticWithLocation {
	const span = translateRange(report.location, document);

	return {
		...span,
		file,
		messageText: report.tips != null ? [report.message, ...report.tips].join("\n\n") : report.message,
		category: report.severity === "error" ? tsModule.ts.DiagnosticCategory.Error : tsModule.ts.DiagnosticCategory.Warning,
		source: DIAGNOSTIC_SOURCE,
		code: 2322
	};
}

function translateDiagnostics(reports: LitDiagnostic[], file: SourceFile, document: CssDocument): ts.DiagnosticWithLocation[] {
	return reports.map(report => translateDiagnostic(report, file, document));
}

function translateDefinition(definition: LitDefinition, document: CssDocument): ts.DefinitionInfoAndBoundSpan {
	const cls = definition.targetClass;
	const prop = definition.targetProp;

	const { start: targetStart, end: targetEnd } = prop != null ? prop!.location : cls.location;

	return {
		definitions: [
			{
				name: (prop != null ? prop!.name : cls.meta.className) || "",
				textSpan: {
					start: targetStart,
					length: targetEnd - targetStart
				},
				fileName: cls.fileName,
				containerName: cls.fileName,
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
					return translateDiagnostics(results, context.sourceFile, document);
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
