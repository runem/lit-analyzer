import { setTypescriptModule as setTypescriptModuleTsSimpleType } from "ts-simple-type";
import { SourceFile } from "typescript";
import { LitCssDocumentAnalyzer } from "./document-analyzer/css/lit-css-document-analyzer";
import { LitHtmlDocumentAnalyzer } from "./document-analyzer/html/lit-html-document-analyzer";
import { renameLocationsForTagName } from "./document-analyzer/html/rename-locations/rename-locations-for-tag-name";
import { LitAnalyzerContext, LitAnalyzerRequest } from "./lit-analyzer-context";
import { CssDocument } from "./parse/document/text-document/css-document/css-document";
import { HtmlDocument } from "./parse/document/text-document/html-document/html-document";
import { TextDocument } from "./parse/document/text-document/text-document";
import { setTypescriptModule } from "./ts-module";
import { LitClosingTagInfo } from "./types/lit-closing-tag-info";
import { LitCodeFix } from "./types/lit-code-fix";
import { LitCompletion } from "./types/lit-completion";
import { LitCompletionDetails } from "./types/lit-completion-details";
import { LitDefinition } from "./types/lit-definition";
import { LitDiagnostic, LitSourceFileDiagnostic } from "./types/lit-diagnostic";
import { LitFormatEdit } from "./types/lit-format-edit";
import { LitOutliningSpan } from "./types/lit-outlining-span";
import { LitQuickInfo } from "./types/lit-quick-info";
import { LitRenameInfo } from "./types/lit-rename-info";
import { LitRenameLocation } from "./types/lit-rename-location";
import { Range } from "./types/range";
import { getNodeAtPosition, nodeIntersects } from "./util/ast-util";
import { flatten } from "./util/general-util";

export class LitAnalyzer {
	private litHtmlDocumentAnalyzer = new LitHtmlDocumentAnalyzer();
	private litCssDocumentAnalyzer = new LitCssDocumentAnalyzer();

	constructor(private context: LitAnalyzerContext) {
		// Set the Typescript module
		// I plan on removing these methods, so only "context.ts" is used.
		setTypescriptModule(context.ts);
		setTypescriptModuleTsSimpleType(context.ts);
	}

	getOutliningSpansInFile(file: SourceFile): LitOutliningSpan[] {
		const documents = this.getDocumentsInFile(file);

		this.context.updateComponents(file);

		return flatten(
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

	getDefinitionAtPosition(file: SourceFile, position: number): LitDefinition | undefined {
		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position);
		if (document == null) return undefined;

		this.context.updateComponents(file);

		const request = this.makeRequest({ file, document });

		if (document instanceof CssDocument) {
			return this.litCssDocumentAnalyzer.getDefinitionAtOffset(document, offset, request);
		} else if (document instanceof HtmlDocument) {
			return this.litHtmlDocumentAnalyzer.getDefinitionAtOffset(document, offset, request);
		}
		return;
	}

	getQuickInfoAtPosition(file: SourceFile, position: number): LitQuickInfo | undefined {
		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position);
		if (document == null) return undefined;

		this.context.updateComponents(file);

		const request = this.makeRequest({ file, document });

		if (document instanceof CssDocument) {
			return this.litCssDocumentAnalyzer.getQuickInfoAtOffset(document, offset, request);
		} else if (document instanceof HtmlDocument) {
			return this.litHtmlDocumentAnalyzer.getQuickInfoAtOffset(document, offset, request);
		}
		return;
	}

	getRenameInfoAtPosition(file: SourceFile, position: number): LitRenameInfo | undefined {
		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position);
		if (document != null) {
			const request = this.makeRequest({ file, document });

			if (document instanceof CssDocument) {
				return undefined;
			} else if (document instanceof HtmlDocument) {
				return this.litHtmlDocumentAnalyzer.getRenameInfoAtOffset(document, offset, request);
			}
		} else {
			const nodeUnderCursor = getNodeAtPosition(file, position);
			if (nodeUnderCursor == null) return undefined;

			if (this.context.ts.isStringLiteralLike(nodeUnderCursor)) {
				const tagName = nodeUnderCursor.text;
				const definition = this.context.definitionStore.getDefinitionForTagName(tagName);

				if (definition != null && nodeIntersects(nodeUnderCursor, definition.node)) {
					return {
						fullDisplayName: tagName,
						displayName: tagName,
						range: { start: nodeUnderCursor.getStart() + 1, end: nodeUnderCursor.getEnd() - 1 },
						kind: "label",
						target: definition
					};
				}
			}
		}
		return;
	}

	getRenameLocationsAtPosition(file: SourceFile, position: number): LitRenameLocation[] {
		const renameInfo = this.getRenameInfoAtPosition(file, position);
		if (renameInfo == null) return [];

		if ("document" in renameInfo) {
			const document = renameInfo.document;
			const offset = document.virtualDocument.scPositionToOffset(position);
			const request = this.makeRequest({ file, document });

			if (document instanceof CssDocument) {
				return [];
			} else {
				return this.litHtmlDocumentAnalyzer.getRenameLocationsAtOffset(document, offset, request);
			}
		} else {
			return renameLocationsForTagName(renameInfo.target.tagName, this.context);
		}
	}

	getClosingTagAtPosition(file: SourceFile, position: number): LitClosingTagInfo | undefined {
		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position);
		if (document == null) return undefined;

		this.context.updateComponents(file);

		if (document instanceof HtmlDocument) {
			return this.litHtmlDocumentAnalyzer.getClosingTagAtOffset(document, offset);
		}
		return;
	}

	getCompletionDetailsAtPosition(file: SourceFile, position: number, name: string): LitCompletionDetails | undefined {
		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position);
		if (document == null) return undefined;

		const request = this.makeRequest({ file, document });

		if (document instanceof CssDocument) {
			return this.litCssDocumentAnalyzer.getCompletionDetailsAtOffset(document, offset, name, request);
		} else if (document instanceof HtmlDocument) {
			return this.litHtmlDocumentAnalyzer.getCompletionDetailsAtOffset(document, offset, name, request);
		}
		return;
	}

	getCompletionsAtPosition(file: SourceFile, position: number): LitCompletion[] | undefined {
		const { document, offset } = this.getDocumentAndOffsetAtPosition(file, position);

		if (document == null) return undefined;

		this.context.updateComponents(file);

		const request = this.makeRequest({ file, document });

		if (document instanceof CssDocument) {
			return this.litCssDocumentAnalyzer.getCompletionsAtOffset(document, offset, request);
		} else if (document instanceof HtmlDocument) {
			return this.litHtmlDocumentAnalyzer.getCompletionsAtOffset(document, offset, request);
		}
		return;
	}

	getDiagnosticsInFile(file: SourceFile): LitDiagnostic[] {
		const documents = this.getDocumentsInFile(file);

		this.context.updateComponents(file);
		this.context.updateDependencies(file);

		const documentDiagnostics = flatten(
			documents.map(document => {
				const request = this.makeRequest({ document, file });

				if (document instanceof CssDocument) {
					return this.litCssDocumentAnalyzer.getDiagnostics(document, request);
				} else if (document instanceof HtmlDocument) {
					return this.litHtmlDocumentAnalyzer.getDiagnostics(document, request);
				}

				return [];
			})
		);

		const analyzeDiagnostics = this.context.definitionStore.getAnalysisDiagnosticsInFile(file).map(
			diagnostic =>
				({
					file: diagnostic.node.getSourceFile(),
					message: diagnostic.message,
					severity: diagnostic.severity,
					location: {
						start: diagnostic.node.getStart(),
						end: diagnostic.node.getEnd()
					}
				} as LitSourceFileDiagnostic)
		);

		return [...documentDiagnostics, ...analyzeDiagnostics];
	}

	getCodeFixesAtPositionRange(file: SourceFile, positionRange: Range): LitCodeFix[] {
		const { document } = this.getDocumentAndOffsetAtPosition(file, positionRange.start);
		if (document == null) return [];

		this.context.updateComponents(file);
		this.context.updateDependencies(file);

		const offsetRange: Range = {
			start: document.virtualDocument.scPositionToOffset(positionRange.start),
			end: document.virtualDocument.scPositionToOffset(positionRange.end)
		};

		const request = this.makeRequest({ file, document });

		if (document instanceof HtmlDocument) {
			return this.litHtmlDocumentAnalyzer.getCodeFixesAtOffsetRange(document, offsetRange, request);
		}

		return [];
	}

	getFormatEditsInFile(file: SourceFile, settings: ts.FormatCodeSettings): LitFormatEdit[] {
		const documents = this.getDocumentsInFile(file);

		return flatten(
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

	/*private sendRequest<FuncName extends keyof LitDocumentAnalyzer, Params extends Parameters<NonNullable<LitDocumentAnalyzer[FuncName]>>>( funcName: "getCompletionsAtOffset", { file, document }: { file: SourceFile; document: TextDocument }, offset: number);
	 private sendRequest<FuncName extends keyof LitDocumentAnalyzer, Params extends Parameters<NonNullable<LitDocumentAnalyzer[FuncName]>>>( funcName: FuncName, { file, document }: { file: SourceFile; document: TextDocument }, arg1: number ) {
	 const request = this.makeRequest({ file, document });

	 const func = (() => {
	 if (document instanceof CssDocument) {
	 //return this.litCssDocumentAnalyzer[funcName];
	 } else if (document instanceof HtmlDocument) {
	 return this.litHtmlDocumentAnalyzer[funcName];
	 }
	 })() as LitDocumentAnalyzer[FuncName];

	 if (func == null) return undefined;

	 switch (funcName) {
	 case "getCompletionsAtOffset":
	 return func(document, arg1, request);
	 }
	 }*/

	/*private sendRequest<
	 FuncName extends keyof LitDocumentAnalyzer,
	 Params extends Parameters<NonNullable<LitDocumentAnalyzer[FuncName]>>,
	 Arg = Params extends { length: infer L } ? (L extends 1 ? never : (L extends 2 ? never : Params[1])) : never
	 >(funcName: FuncName, { file, document }: { file: SourceFile; document: TextDocument }, arg1: Arg) {
	 const request = this.makeRequest({ file, document });

	 const func = (() => {
	 if (document instanceof CssDocument) {
	 return this.litCssDocumentAnalyzer[funcName];
	 } else if (document instanceof HtmlDocument) {
	 return this.litHtmlDocumentAnalyzer[funcName];
	 }
	 })();

	 if (arg1 == null) {
	 }
	 }*/

	private makeRequest(options: { document: TextDocument; file: SourceFile }): LitAnalyzerRequest {
		const {
			project,
			htmlStore,
			dependencyStore,
			definitionStore,
			config,
			updateDependencies,
			updateComponents,
			ts,
			program,
			documentStore,
			logger,
			updateConfig,
			rules
		} = this.context;

		return {
			htmlStore,
			dependencyStore,
			definitionStore,
			config,
			updateDependencies,
			updateComponents,
			ts,
			project,
			program,
			documentStore,
			logger,
			updateConfig,
			rules,
			...options
		};
	}

	private getDocumentAndOffsetAtPosition(sourceFile: SourceFile, position: number): { document: TextDocument | undefined; offset: number } {
		const document = this.context.documentStore.getDocumentAtPosition(sourceFile, position, this.context.config);

		return {
			document,
			offset: document != null ? document.virtualDocument.scPositionToOffset(position) : -1
		};
	}

	private getDocumentsInFile(sourceFile: SourceFile): TextDocument[] {
		return this.context.documentStore.getDocumentsInFile(sourceFile, this.context.config);
	}
}
