import * as vscode from "vscode-css-languageservice";
import { IAtDirectiveData, ICSSDataProvider, IPropertyData, IPseudoClassData, IPseudoElementData } from "vscode-css-languageservice";
import { isRuleDisabled } from "../../lit-analyzer-config";
import { LitAnalyzerContext } from "../../lit-analyzer-context";
import { CssDocument } from "../../parse/document/text-document/css-document/css-document";
import { documentationForCssPart, documentationForCssProperty, documentationForHtmlTag } from "../../parse/parse-html-data/html-tag";
import { AnalyzerHtmlStore } from "../../store/analyzer-html-store";
import { LitCompletion } from "../../types/lit-completion";
import { LitDiagnostic } from "../../types/lit-diagnostic";
import { LitQuickInfo } from "../../types/lit-quick-info";
import { LitTargetKind } from "../../types/lit-target-kind";
import { DocumentOffset } from "../../types/range";
import { lazy } from "../../util/general-util";
import { getPositionContextInDocument, grabWordInDirection } from "../../util/get-position-context-in-document";
import { iterableFilter, iterableMap } from "../../util/iterable-util";
import { documentRangeToSFRange } from "../../util/range-util";

function makeVscTextDocument(cssDocument: CssDocument): vscode.TextDocument {
	return vscode.TextDocument.create("untitled://embedded.css", "css", 1, cssDocument.virtualDocument.text);
}

export class LitCssVscodeService {
	private dataProvider = new LitVscodeCSSDataProvider();

	private get cssService() {
		return vscode.getCSSLanguageService({ customDataProviders: [this.dataProvider.provider] });
	}

	private get scssService() {
		return vscode.getSCSSLanguageService({ customDataProviders: [this.dataProvider.provider] });
	}

	getDiagnostics(document: CssDocument, context: LitAnalyzerContext): LitDiagnostic[] {
		if (isRuleDisabled(context.config, "no-invalid-css")) {
			return [];
		}

		this.dataProvider.update(context.htmlStore);

		const vscTextDocument = makeVscTextDocument(document);

		// Return nothing if this is a one liner css snippet.
		// Example: css`100px`
		if (!vscTextDocument.getText().includes("\n")) {
			return [];
		}

		const vscStylesheet = this.makeVscStylesheet(vscTextDocument);
		const diagnostics = this.scssService.doValidation(vscTextDocument, vscStylesheet);

		return diagnostics
			.filter(diagnostic => diagnostic.range.start.line !== 0 && diagnostic.range.start.line < vscTextDocument.lineCount - 1)
			.map(
				diagnostic =>
					({
						severity: diagnostic.severity === vscode.DiagnosticSeverity.Error ? "error" : "warning",
						source: "no-invalid-css",
						location: documentRangeToSFRange(document, {
							start: vscTextDocument.offsetAt(diagnostic.range.start),
							end: vscTextDocument.offsetAt(diagnostic.range.end)
						}),
						message: diagnostic.message,
						file: context.currentFile
					} as LitDiagnostic)
			);
	}

	getQuickInfo(document: CssDocument, offset: DocumentOffset, context: LitAnalyzerContext): LitQuickInfo | undefined {
		this.dataProvider.update(context.htmlStore);

		const vscTextDocument = makeVscTextDocument(document);
		const vscStylesheet = this.makeVscStylesheet(vscTextDocument);
		const vscPosition = vscTextDocument.positionAt(offset);
		const hover = this.scssService.doHover(vscTextDocument, vscPosition, vscStylesheet);
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
			range: documentRangeToSFRange(document, { start: vscTextDocument.offsetAt(hover.range.start), end: vscTextDocument.offsetAt(hover.range.end) })
		};
	}

	getCompletions(document: CssDocument, offset: DocumentOffset, context: LitAnalyzerContext): LitCompletion[] {
		this.dataProvider.update(context.htmlStore);

		const positionContext = getPositionContextInDocument(document, offset);

		// If there is ":" before the word, treat them like it's a part of the "leftWord", because ":" is a part of the name, but also a separator
		if (positionContext.beforeWord === ":") {
			positionContext.leftWord =
				":" +
				grabWordInDirection({
					startOffset: offset - positionContext.leftWord.length - 1,
					stopChar: /[^:]/,
					direction: "left",
					text: document.virtualDocument.text
				}) +
				positionContext.leftWord;
		}

		const range = documentRangeToSFRange(document, {
			start: positionContext.offset - positionContext.leftWord.length,
			end: positionContext.offset + positionContext.rightWord.length
		});

		const vscTextDocument = makeVscTextDocument(document);
		const vscStylesheet = this.makeVscStylesheet(vscTextDocument);
		const vscPosition = vscTextDocument.positionAt(offset);
		const items = this.cssService.doComplete(vscTextDocument, vscPosition, vscStylesheet);

		// Get all completions from vscode html language service
		const completions = items.items.map(
			i =>
				({
					kind: i.kind == null ? "unknown" : translateCompletionItemKind(i.kind),
					name: i.label,
					insert: i.label, //replacePrefix(i.label, positionContext.leftWord),
					kindModifiers: i.kind === vscode.CompletionItemKind.Color ? "color" : undefined,
					documentation: lazy(() => (typeof i.documentation === "string" || i.documentation == null ? i.documentation : i.documentation.value)),
					sortText: i.sortText,
					range
				} as LitCompletion)
		);

		// Add completions for css custom properties
		for (const cssProp of context.htmlStore.getAllCssPropertiesForTag("")) {
			if (completions.some(c => c.name === cssProp.name)) {
				continue;
			}

			completions.push({
				kind: "variableElement",
				name: cssProp.name,
				insert: cssProp.name,
				sortText: positionContext.leftWord.startsWith("-") ? "0" : "e_0",
				documentation: lazy(() => documentationForCssProperty(cssProp)),
				range
			});
		}

		if (positionContext.beforeWord === "(") {
			// Get the name of the pseudo element
			const pseudoElementName = grabWordInDirection({
				startOffset: offset - positionContext.leftWord.length - 1,
				stopChar: /[^-A-Za-z]/,
				direction: "left",
				text: document.virtualDocument.text
			});

			// Add completions for css shadow parts
			if (pseudoElementName === "part") {
				for (const cssPart of context.htmlStore.getAllCssPartsForTag("")) {
					completions.push({
						kind: "variableElement",
						name: cssPart.name,
						insert: cssPart.name,
						sortText: "0",
						documentation: lazy(() => documentationForCssPart(cssPart)),
						range
					});
				}
			}
		}

		return completions;
	}

	private makeVscStylesheet(vscTextDocument: vscode.TextDocument) {
		return this.scssService.parseStylesheet(vscTextDocument);
	}
}

function translateCompletionItemKind(kind: vscode.CompletionItemKind): LitTargetKind {
	switch (kind) {
		case vscode.CompletionItemKind.Method:
			return "memberFunctionElement";
		case vscode.CompletionItemKind.Function:
			return "functionElement";
		case vscode.CompletionItemKind.Constructor:
			return "constructorImplementationElement";
		case vscode.CompletionItemKind.Field:
		case vscode.CompletionItemKind.Variable:
			return "variableElement";
		case vscode.CompletionItemKind.Class:
			return "classElement";
		case vscode.CompletionItemKind.Interface:
			return "interfaceElement";
		case vscode.CompletionItemKind.Module:
			return "moduleElement";
		case vscode.CompletionItemKind.Property:
			return "memberVariableElement";
		case vscode.CompletionItemKind.Unit:
		case vscode.CompletionItemKind.Value:
			return "constElement";
		case vscode.CompletionItemKind.Enum:
			return "enumElement";
		case vscode.CompletionItemKind.Keyword:
			return "keyword";
		case vscode.CompletionItemKind.Color:
			return "constElement";
		case vscode.CompletionItemKind.Reference:
			return "alias";
		case vscode.CompletionItemKind.File:
			return "moduleElement";
		case vscode.CompletionItemKind.Snippet:
		case vscode.CompletionItemKind.Text:
		default:
			return "unknown";
	}
}

class LitVscodeCSSDataProvider {
	private pseudoElementData: IPseudoElementData[] = [];

	private customDataProvider: ICSSDataProvider = (() => {
		const provider = this;

		return {
			providePseudoElements(): IPseudoElementData[] {
				return [
					{
						browsers: [],
						description: `Unlike ::part, ::theme matches elements parts with that theme name, anywhere in the document.`,
						name: "::theme",
						status: "nonstandard"
					}
				];
			},
			provideAtDirectives(): IAtDirectiveData[] {
				return [];
			},
			providePseudoClasses(): IPseudoClassData[] {
				return provider.pseudoElementData;
			},
			provideProperties(): IPropertyData[] {
				return [];
			}
		};
	})();

	get provider(): ICSSDataProvider {
		return this.customDataProvider;
	}

	update(htmlStore: AnalyzerHtmlStore) {
		this.pseudoElementData = Array.from(
			iterableMap(
				iterableFilter(htmlStore.getGlobalTags(), tag => !tag.builtIn),
				tag =>
					({
						browsers: [],
						description: documentationForHtmlTag(tag),
						name: tag.tagName,
						status: "standard"
					} as IPseudoElementData)
			)
		);
	}
}
