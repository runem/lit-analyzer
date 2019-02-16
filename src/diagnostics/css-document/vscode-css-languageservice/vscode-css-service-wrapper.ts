import { CompletionEntry, CompletionInfo, DiagnosticCategory, DiagnosticWithLocation, QuickInfo, SymbolDisplayPart } from "typescript";
import * as vscode from "vscode-css-languageservice";
import { DIAGNOSTIC_SOURCE } from "../../../constants";
import { CssDocument } from "../../../parsing/text-document/css-document/css-document";
import { VirtualDocument } from "../../../parsing/virtual-document/virtual-document";
import { tsModule } from "../../../ts-module";
import { logger } from "../../../util/logger";

const cssService = vscode.getCSSLanguageService();

export class VscodeCssServiceWrapper {
	private virtualDocument: VirtualDocument;

	private _vscTextDocument: vscode.TextDocument | undefined;
	private get vscTextDocument(): vscode.TextDocument {
		if (this._vscTextDocument == null) {
			this._vscTextDocument = vscode.TextDocument.create("untitled://embedded.html", "css", 1, this.virtualDocument.text);
		}
		return this._vscTextDocument;
	}

	private _vscStylesheet: vscode.Stylesheet | undefined;
	private get vscStylesheet(): vscode.Stylesheet {
		if (this._vscStylesheet == null) {
			this._vscStylesheet = cssService.parseStylesheet(this.vscTextDocument);
		}
		return this._vscStylesheet;
	}

	constructor(cssDocument: CssDocument);
	constructor(virtualDocument: VirtualDocument);
	constructor(document: CssDocument | VirtualDocument) {
		if ("virtualDocument" in document) {
			this.virtualDocument = document.virtualDocument;
		} else {
			this.virtualDocument = document;
		}
	}

	getDiagnostics(): DiagnosticWithLocation[] {
		const diagnostics = cssService.doValidation(this.vscTextDocument, this.vscStylesheet);

		return diagnostics
			.filter(diagnostic => diagnostic.range.start.line !== 0 && diagnostic.range.start.line < this.vscTextDocument.lineCount - 1)
			.map(
				diagnostic =>
					({
						messageText: diagnostic.message,
						category: this.severityToCategory(diagnostic.severity),
						file: this.virtualDocument.astNode.getSourceFile(),
						...this.rangeToTsSpan(diagnostic.range),
						source: DIAGNOSTIC_SOURCE,
						code: 2322
					} as DiagnosticWithLocation)
			);
	}

	getQuickInfoAtPosition(positionInText: number): QuickInfo | undefined {
		const position = this.vscTextDocument.positionAt(positionInText);
		const hover = cssService.doHover(this.vscTextDocument, position, this.vscStylesheet);
		if (hover == null || hover.range == null) return;

		const contents = Array.isArray(hover.contents) ? hover.contents : [hover.contents];
		const displayParts: SymbolDisplayPart[] = [];
		const documentation: SymbolDisplayPart[] = [];
		for (const content of contents) {
			const text = typeof content === "string" ? content : content.value;

			if (typeof content === "object" && "language" in content) {
				if (content.language === "html") {
					if (displayParts.length > 0) displayParts.push({ kind: "text", text: "\n\n" });
					displayParts.push({ kind: "text", text });
				}
			} else {
				documentation.push({ kind: "text", text });
			}
		}

		logger.debug(contents);
		return {
			kind: tsModule.ts.ScriptElementKind.label,
			kindModifiers: "",
			textSpan: this.rangeToTsSpan(hover.range),
			displayParts,
			documentation
		};
	}

	getCompletionInfoAtPosition(positionInText: number): CompletionInfo | undefined {
		const position = this.vscTextDocument.positionAt(positionInText);
		const items = cssService.doComplete(this.vscTextDocument, position, this.vscStylesheet);

		return {
			isGlobalCompletion: false,
			isMemberCompletion: false,
			isNewIdentifierLocation: false,
			entries: items.items.map(
				i =>
					({
						name: i.label,
						insertText: i.label,
						kind: tsModule.ts.ScriptElementKind.memberVariableElement,
						sortText: i.sortText
					} as CompletionEntry)
			)
		};
	}

	private rangeToTsSpan(range: vscode.Range): { start: number; length: number } {
		const nodeOffset = this.virtualDocument.astNode.template.getFullStart();
		const startInDoc = this.vscTextDocument.offsetAt(range.start);
		const endInDoc = this.vscTextDocument.offsetAt(range.end);

		return {
			start: nodeOffset + startInDoc,
			length: endInDoc - startInDoc
		};
	}

	private severityToCategory(severity: vscode.DiagnosticSeverity | undefined): DiagnosticCategory {
		switch (severity) {
			case vscode.DiagnosticSeverity.Error:
				return tsModule.ts.DiagnosticCategory.Error;
			case vscode.DiagnosticSeverity.Warning:
				return tsModule.ts.DiagnosticCategory.Warning;
			case vscode.DiagnosticSeverity.Hint:
			case vscode.DiagnosticSeverity.Information:
				return tsModule.ts.DiagnosticCategory.Message;
			default:
				return tsModule.ts.DiagnosticCategory.Error;
		}
	}
}
