import * as vscode from "vscode-css-languageservice";
import { CssDocument } from "../../parsing/text-document/css-document/css-document";
import { DiagnosticsContext } from "../diagnostics-context";
import { LitCompletion } from "../types/lit-completion";
import { LitCssDiagnostic } from "../types/lit-diagnostic";
import { LitQuickInfo } from "../types/lit-quick-info";

//const cssService = vscode.getCSSLanguageService();
const scssService = vscode.getSCSSLanguageService();

function makeVscTextDocument(cssDocument: CssDocument): vscode.TextDocument {
	return vscode.TextDocument.create("untitled://embedded.css", "css", 1, cssDocument.virtualDocument.text);
}

function makeVscStylesheet(vscTextDocument: vscode.TextDocument) {
	return scssService.parseStylesheet(vscTextDocument);
}

export class VscodeCssService {
	getDiagnostics(document: CssDocument, context: DiagnosticsContext): LitCssDiagnostic[] {
		const vscTextDocument = makeVscTextDocument(document);
		const vscStylesheet = makeVscStylesheet(vscTextDocument);
		const diagnostics = scssService.doValidation(vscTextDocument, vscStylesheet);

		return diagnostics
			.filter(diagnostic => diagnostic.range.start.line !== 0 && diagnostic.range.start.line < vscTextDocument.lineCount - 1)
			.map(
				diagnostic =>
					({
						severity: diagnostic.severity === vscode.DiagnosticSeverity.Error ? "error" : "warning",
						location: {
							start: vscTextDocument.offsetAt(diagnostic.range.start),
							end: vscTextDocument.offsetAt(diagnostic.range.end)
						},
						message: diagnostic.message
					} as LitCssDiagnostic)
			);
	}

	getQuickInfo(document: CssDocument, offset: number): LitQuickInfo | undefined {
		const vscTextDocument = makeVscTextDocument(document);
		const vscStylesheet = makeVscStylesheet(vscTextDocument);
		const vscPosition = vscTextDocument.positionAt(offset);
		const hover = scssService.doHover(vscTextDocument, vscPosition, vscStylesheet);
		if (hover == null || hover.range == null) return;

		const contents = Array.isArray(hover.contents) ? hover.contents : [hover.contents];
		let primaryInfo: string | undefined = undefined;
		let secondaryInfo: string | undefined = undefined;

		for (const content of contents) {
			const text = typeof content === "string" ? content : content.value;

			if (typeof content === "object" && "language" in content) {
				if (content.language === "html") {
					primaryInfo = `${primaryInfo == null ? "" : "\n\n"}${text}`;
				}
			} else {
				secondaryInfo = text;
			}
		}

		return {
			primaryInfo: primaryInfo || "",
			secondaryInfo,
			range: {
				start: vscTextDocument.offsetAt(hover.range.start),
				end: vscTextDocument.offsetAt(hover.range.end)
			}
		};
	}

	getCompletions(document: CssDocument, offset: number): LitCompletion[] {
		const vscTextDocument = makeVscTextDocument(document);
		const vscStylesheet = makeVscStylesheet(vscTextDocument);
		const vscPosition = vscTextDocument.positionAt(offset);
		const items = scssService.doComplete(vscTextDocument, vscPosition, vscStylesheet);

		return items.items.map(
			i =>
				({
					kind: "member",
					insert: i.label,
					name: i.label,
					importance: i.label.startsWith("@") || i.label.startsWith("-") ? "low" : i.label.startsWith(":") ? "medium" : "high"
				} as LitCompletion)
		);
	}
}
