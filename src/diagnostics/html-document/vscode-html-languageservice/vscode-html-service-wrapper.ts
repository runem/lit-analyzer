import * as ts from "typescript";
import * as vscode from "vscode-html-languageservice";
import { HtmlDocument } from "../../../parsing/text-document/html-document/html-document";
import { VirtualDocument } from "../../../parsing/virtual-document/virtual-document";

const htmlService = vscode.getLanguageService();

export class VscodeHtmlServiceWrapper {
	private virtualDocument: VirtualDocument;

	private _vscTextDocument: vscode.TextDocument | undefined;
	private get vscTextDocument(): vscode.TextDocument {
		if (this._vscTextDocument == null) {
			this._vscTextDocument = vscode.TextDocument.create("untitled://embedded.html", "html", 1, this.virtualDocument.text);
		}
		return this._vscTextDocument;
	}

	private _vscHtmlDocument: vscode.HTMLDocument | undefined;
	private get vscHtmlDocument(): vscode.HTMLDocument {
		if (this._vscHtmlDocument == null) {
			this._vscHtmlDocument = htmlService.parseHTMLDocument(this.vscTextDocument);
		}
		return this._vscHtmlDocument;
	}

	constructor(htmlDocument: HtmlDocument);
	constructor(virtualDocument: VirtualDocument);
	constructor(document: HtmlDocument | VirtualDocument) {
		if ("virtualDocument" in document) {
			this.virtualDocument = document.virtualDocument;
		} else {
			this.virtualDocument = document;
		}
	}

	doTagComplete(position: number): ts.JsxClosingTagInfo | undefined {
		const positionInText = this.virtualDocument.offsetAtSourceCodePosition(position);
		const htmlLSPosition = this.vscTextDocument.positionAt(positionInText);

		const tagComplete = htmlService.doTagComplete(this.vscTextDocument, htmlLSPosition, this.vscHtmlDocument);
		if (tagComplete == null) return;

		// Html returns completions with snippet placeholders. Strip these out.
		const newText = tagComplete.replace(/\$\d/g, "");

		return { newText };
	}

	format(settings: ts.FormatCodeSettings): ts.TextChange[] {
		const edits = htmlService.format(this.vscTextDocument, undefined, {
			tabSize: settings.tabSize,
			insertSpaces: !!settings.convertTabsToSpaces,
			wrapLineLength: 90,
			unformatted: "",
			contentUnformatted: "pre,code,textarea",
			indentInnerHtml: true,
			preserveNewLines: true,
			maxPreserveNewLines: undefined,
			indentHandlebars: false,
			endWithNewline: false,
			extraLiners: "head, body, /html",
			wrapAttributes: "aligned-multiple"
		});

		const newText = vscode.TextDocument.applyEdits(this.vscTextDocument, edits);
		const split = newText.split(/\$\s*\{\s*(\d+_expression-placeholder)\s*\}/gm);

		const node = this.virtualDocument.astNode.template;

		const res: ts.TextChange[] = [];
		let prevIndex = node.getStart();
		for (let i = 0; i < split.length; i += 2) {
			if (i % 2 === 0) {
				const nextExpressionNode = this.virtualDocument.getSubstitutionWithId(split[i + 1]);

				const startOffset = i !== 0 ? 1 : 0;
				const endOffset = nextExpressionNode != null ? -2 : 0;

				const start = prevIndex + startOffset;
				const end = (nextExpressionNode != null ? nextExpressionNode.getFullStart() : node.getEnd()) + endOffset;

				res.push({
					span: { start, length: end - start },
					newText: split[i] || ""
				});

				if (nextExpressionNode == null) break;
				if (ts.isTemplateSpan(nextExpressionNode.parent)) {
					prevIndex = nextExpressionNode.parent.literal.getStart();
				} else {
					prevIndex = nextExpressionNode.getEnd();
				}
			}
		}

		return res;
	}
}
