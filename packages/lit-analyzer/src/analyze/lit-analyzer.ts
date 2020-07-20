import { SourceFile } from "typescript";
import { ComponentAnalyzer } from "./component-analyzer/component-analyzer";
import { LitCssDocumentAnalyzer } from "./document-analyzer/css/lit-css-document-analyzer";
import { LitHtmlDocumentAnalyzer } from "./document-analyzer/html/lit-html-document-analyzer";
import { renameLocationsForTagName } from "./document-analyzer/html/rename-locations/rename-locations-for-tag-name";
import { RULE_ID_CODE_MAP } from "./lit-analyzer-config";
import { LitAnalyzerContext } from "./lit-analyzer-context";
import { CssDocument } from "./parse/document/text-document/css-document/css-document";
import { HtmlDocument } from "./parse/document/text-document/html-document/html-document";
import { TextDocument } from "./parse/document/text-document/text-document";
import { setTypescriptModule } from "./ts-module";
import { LitClosingTagInfo } from "./types/lit-closing-tag-info";
import { LitCodeFix } from "./types/lit-code-fix";
import { LitCompletion } from "./types/lit-completion";
import { LitCompletionDetails } from "./types/lit-completion-details";
import { LitDefinition } from "./types/lit-definition";
import { LitDiagnostic } from "./types/lit-diagnostic";
import { LitFormatEdit } from "./types/lit-format-edit";
import { LitOutliningSpan } from "./types/lit-outlining-span";
import { LitQuickInfo } from "./types/lit-quick-info";
import { LitRenameInfo } from "./types/lit-rename-info";
import { LitRenameLocation } from "./types/lit-rename-location";
import { DocumentOffset, Range, SourceFilePosition } from "./types/range";
import { arrayFlat } from "./util/array-util";
import { getNodeAtPosition, nodeIntersects } from "./util/ast-util";
import { iterableFirst } from "./util/iterable-util";
import { makeSourceFileRange, sfRangeToDocumentRange } from "./util/range-util";
import { SourceFileAnalyzer } from "./sourcefile-analyzer/sourcefile-analyzer";

export class LitAnalyzer {
	private litHtmlDocumentAnalyzer = new LitHtmlDocumentAnalyzer();
	private litCssDocumentAnalyzer = new LitCssDocumentAnalyzer();
	private componentAnalyzer = new ComponentAnalyzer();
	private sourceFileAnalyzer = new SourceFileAnalyzer();

	constructor(private context: LitAnalyzerContext) {
		// Set the Typescript module
		// I plan on removing this function, so only "context.ts" is used.
		setTypescriptModule(context.ts);
	}

	getSupportedCodeFixes(): string[] {
		return Object.values(RULE_ID_CODE_MAP).map(String);
	}

	getOutliningSpansInFile(file: SourceFile): LitOutliningSpan[] {
		this.context.setContextBase({ file });

		const documents = this.getDocumentsInFile(file);

		this.context.updateComponents(file);

		return arrayFlat(
			documents.map(document => {
				if (document instanceof CssDocument) {
					return [];
				} else if (document instanceof HtmlDocument) {
					return this.litHtmlDocumentAnalyzer.getOutliningSpans(document);
				}

				return [];
			})
		);
	}

	getDefinitionAtPosition(file: SourceFile, position: SourceFilePosition): LitDefinition | undefined {
		this.context.setContextBase({ file });

		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position);
		if (document == null) return undefined;

		this.context.updateComponents(file);

		if (document instanceof CssDocument) {
			return this.litCssDocumentAnalyzer.getDefinitionAtOffset(document, offset, this.context);
		} else if (document instanceof HtmlDocument) {
			return this.litHtmlDocumentAnalyzer.getDefinitionAtOffset(document, offset, this.context);
		}
		return;
	}

	getQuickInfoAtPosition(file: SourceFile, position: SourceFilePosition): LitQuickInfo | undefined {
		this.context.setContextBase({ file });

		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position);
		if (document == null) return undefined;

		this.context.updateComponents(file);

		if (document instanceof CssDocument) {
			return this.litCssDocumentAnalyzer.getQuickInfoAtOffset(document, offset, this.context);
		} else if (document instanceof HtmlDocument) {
			return this.litHtmlDocumentAnalyzer.getQuickInfoAtOffset(document, offset, this.context);
		}
		return;
	}

	getRenameInfoAtPosition(file: SourceFile, position: SourceFilePosition): LitRenameInfo | undefined {
		this.context.setContextBase({ file });

		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position);
		if (document != null) {
			if (document instanceof CssDocument) {
				return undefined;
			} else if (document instanceof HtmlDocument) {
				return this.litHtmlDocumentAnalyzer.getRenameInfoAtOffset(document, offset, this.context);
			}
		} else {
			const nodeUnderCursor = getNodeAtPosition(file, position);
			if (nodeUnderCursor == null) return undefined;

			if (this.context.ts.isStringLiteralLike(nodeUnderCursor)) {
				const tagName = nodeUnderCursor.text;
				const definition = this.context.definitionStore.getDefinitionForTagName(tagName);

				if (definition != null && nodeIntersects(nodeUnderCursor, iterableFirst(definition.tagNameNodes)!)) {
					return {
						fullDisplayName: tagName,
						displayName: tagName,
						range: makeSourceFileRange({ start: nodeUnderCursor.getStart() + 1, end: nodeUnderCursor.getEnd() - 1 }),
						kind: "label",
						target: definition
					};
				}
			}
		}
		return;
	}

	getRenameLocationsAtPosition(file: SourceFile, position: SourceFilePosition): LitRenameLocation[] {
		this.context.setContextBase({ file });

		const renameInfo = this.getRenameInfoAtPosition(file, position);
		if (renameInfo == null) return [];

		if ("document" in renameInfo) {
			const document = renameInfo.document;
			const offset = document.virtualDocument.sfPositionToDocumentOffset(position);

			if (document instanceof CssDocument) {
				return [];
			} else {
				return this.litHtmlDocumentAnalyzer.getRenameLocationsAtOffset(document, offset, this.context);
			}
		} else {
			return renameLocationsForTagName(renameInfo.target.tagName, this.context);
		}
	}

	getClosingTagAtPosition(file: SourceFile, position: SourceFilePosition): LitClosingTagInfo | undefined {
		this.context.setContextBase({ file });

		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position);
		if (document == null) return undefined;

		this.context.updateComponents(file);

		if (document instanceof HtmlDocument) {
			return this.litHtmlDocumentAnalyzer.getClosingTagAtOffset(document, offset);
		}
		return;
	}

	getCompletionDetailsAtPosition(file: SourceFile, position: SourceFilePosition, name: string): LitCompletionDetails | undefined {
		this.context.setContextBase({ file });

		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position);
		if (document == null) return undefined;

		if (document instanceof CssDocument) {
			return this.litCssDocumentAnalyzer.getCompletionDetailsAtOffset(document, offset, name, this.context);
		} else if (document instanceof HtmlDocument) {
			return this.litHtmlDocumentAnalyzer.getCompletionDetailsAtOffset(document, offset, name, this.context);
		}
		return;
	}

	getCompletionsAtPosition(file: SourceFile, position: SourceFilePosition): LitCompletion[] | undefined {
		this.context.setContextBase({ file });

		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position);

		if (document == null) return undefined;

		this.context.updateComponents(file);

		if (document instanceof CssDocument) {
			return this.litCssDocumentAnalyzer.getCompletionsAtOffset(document, offset, this.context);
		} else if (document instanceof HtmlDocument) {
			return this.litHtmlDocumentAnalyzer.getCompletionsAtOffset(document, offset, this.context);
		}
		return;
	}

	getDiagnosticsInFile(file: SourceFile): LitDiagnostic[] {
		this.context.setContextBase({ file, timeout: 7000, throwOnCancellation: true });

		this.context.updateComponents(file);
		this.context.updateDependencies(file);

		const documents = this.getDocumentsInFile(file);

		const diagnostics: LitDiagnostic[] = [];

		// Get diagnostics for components definitions in this file
		const definitions = this.context.definitionStore.getDefinitionsWithDeclarationInFile(file);
		for (const definition of definitions) {
			if (this.context.isCancellationRequested) {
				break;
			}

			diagnostics.push(...this.componentAnalyzer.getDiagnostics(definition, this.context));
		}

		// Get diagnostics for components in this file
		const declarations = this.context.definitionStore.getComponentDeclarationsInFile(file);
		for (const declaration of declarations) {
			if (this.context.isCancellationRequested) {
				break;
			}

			diagnostics.push(...this.componentAnalyzer.getDiagnostics(declaration, this.context));
		}

		// Get diagnostics for documents in this file
		for (const document of documents) {
			if (this.context.isCancellationRequested) {
				break;
			}

			if (document instanceof CssDocument) {
				diagnostics.push(...this.litCssDocumentAnalyzer.getDiagnostics(document, this.context));
			} else if (document instanceof HtmlDocument) {
				diagnostics.push(...this.litHtmlDocumentAnalyzer.getDiagnostics(document, this.context));
			}
		}

		// Get general diagnostics for this file.
		diagnostics.push(...this.sourceFileAnalyzer.getDiagnostics(this.context));

		return diagnostics;
	}

	getCodeFixesAtPositionRange(file: SourceFile, sourceFileRange: Range): LitCodeFix[] {
		this.context.setContextBase({ file });

		const { document } = this.getDocumentAndOffsetAtPosition(file, sourceFileRange.start);

		this.context.updateComponents(file);
		this.context.updateDependencies(file);

		// Return fixes for intersecting document
		if (document instanceof HtmlDocument) {
			return this.litHtmlDocumentAnalyzer.getCodeFixesAtOffsetRange(document, sfRangeToDocumentRange(document, sourceFileRange), this.context);
		}

		// Else, return fixes for components in this file
		else {
			const definitions = this.context.definitionStore.getDefinitionsWithDeclarationInFile(file);
			for (const definition of definitions) {
				const result = this.componentAnalyzer.getCodeFixesAtOffsetRange(definition, makeSourceFileRange(sourceFileRange), this.context);
				if (result.length > 0) {
					return result;
				}
			}

			const components = this.context.definitionStore.getComponentDeclarationsInFile(file);
			for (const component of components) {
				const result = this.componentAnalyzer.getCodeFixesAtOffsetRange(component, makeSourceFileRange(sourceFileRange), this.context);
				if (result.length > 0) {
					return result;
				}
			}
		}

		return this.sourceFileAnalyzer.getCodeFixesAtOffsetRange(sourceFileRange, this.context);
	}

	getFormatEditsInFile(file: SourceFile, settings: ts.FormatCodeSettings): LitFormatEdit[] {
		this.context.setContextBase({ file });

		const documents = this.getDocumentsInFile(file);

		return arrayFlat(
			documents.map(document => {
				if (document instanceof CssDocument) {
					return [];
				} else if (document instanceof HtmlDocument) {
					return this.litHtmlDocumentAnalyzer.getFormatEdits(document, settings);
				}

				return [];
			})
		);
	}

	private getDocumentAndOffsetAtPosition(
		sourceFile: SourceFile,
		position: SourceFilePosition
	): { document: TextDocument | undefined; offset: DocumentOffset } {
		const document = this.context.documentStore.getDocumentAtPosition(sourceFile, position, this.context.config);

		return {
			document,
			offset: document != null ? document.virtualDocument.sfPositionToDocumentOffset(position) : -1
		};
	}

	private getDocumentsInFile(sourceFile: SourceFile): TextDocument[] {
		return this.context.documentStore.getDocumentsInFile(sourceFile, this.context.config);
	}
}
