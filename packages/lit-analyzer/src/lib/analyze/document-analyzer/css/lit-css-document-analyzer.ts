import { LitAnalyzerContext } from "../../lit-analyzer-context.js";
import { CssDocument } from "../../parse/document/text-document/css-document/css-document.js";
import { LitCompletion } from "../../types/lit-completion.js";
import { LitCompletionDetails } from "../../types/lit-completion-details.js";
import { LitDefinition } from "../../types/lit-definition.js";
import { LitDiagnostic } from "../../types/lit-diagnostic.js";
import { LitQuickInfo } from "../../types/lit-quick-info.js";
import { DocumentOffset } from "../../types/range.js";
import { getNodeIdentifier } from "../../util/ast-util.js";
import { getPositionContextInDocument } from "../../util/get-position-context-in-document.js";
import { iterableDefined } from "../../util/iterable-util.js";
import { documentRangeToSFRange } from "../../util/range-util.js";
import { LitCssVscodeService } from "./lit-css-vscode-service.js";

export class LitCssDocumentAnalyzer {
	private vscodeCssService = new LitCssVscodeService();
	private completionsCache: LitCompletion[] = [];

	getCompletionDetailsAtOffset(
		document: CssDocument,
		offset: DocumentOffset,
		name: string,
		context: LitAnalyzerContext
	): LitCompletionDetails | undefined {
		const completionWithName = this.completionsCache.find(completion => completion.name === name);

		if (completionWithName == null || completionWithName.documentation == null) return undefined;

		const primaryInfo = completionWithName.documentation();
		if (primaryInfo == null) return undefined;

		return {
			name,
			kind: completionWithName.kind,
			primaryInfo
		};
	}

	getCompletionsAtOffset(document: CssDocument, offset: DocumentOffset, context: LitAnalyzerContext): LitCompletion[] {
		this.completionsCache = this.vscodeCssService.getCompletions(document, offset, context);
		return this.completionsCache;
	}

	getQuickInfoAtOffset(document: CssDocument, offset: DocumentOffset, context: LitAnalyzerContext): LitQuickInfo | undefined {
		return this.vscodeCssService.getQuickInfo(document, offset, context);
	}

	getDiagnostics(document: CssDocument, context: LitAnalyzerContext): LitDiagnostic[] {
		return this.vscodeCssService.getDiagnostics(document, context);
	}

	getDefinitionAtOffset(document: CssDocument, offset: DocumentOffset, context: LitAnalyzerContext): LitDefinition | undefined {
		const positionContext = getPositionContextInDocument(document, offset);
		const word = positionContext.word;

		const start = offset - positionContext.leftWord.length;
		const end = start + word.length;

		// Return definitions for css custom properties
		if (word.startsWith("-")) {
			for (const cssProp of context.htmlStore.getAllCssPropertiesForTag("")) {
				if (cssProp.name === word) {
					const nodes = iterableDefined((cssProp.related != null ? cssProp.related : [cssProp]).map(p => p.declaration?.declaration?.node));
					if (nodes.length === 0) {
						return;
					}

					return {
						fromRange: documentRangeToSFRange(document, { start, end }),
						target: nodes.map(node => ({
							kind: "node",
							node: getNodeIdentifier(node, context.ts) || node
						}))
					};
				}
			}
		}

		// Return definitions for custom elements
		else {
			const definition = context.definitionStore.getDefinitionForTagName(word);

			if (definition != null && definition.declaration != null) {
				const node = definition.declaration.node;

				return {
					fromRange: documentRangeToSFRange(document, { start, end }),
					target: {
						kind: "node",
						node: getNodeIdentifier(node, context.ts) || node
					}
				};
			}
		}

		return undefined;
	}
}
