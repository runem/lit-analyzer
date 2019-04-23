import { CssDocument } from "../../parse/document/text-document/css-document/css-document";
import { getPositionContextInDocument } from "../../util/get-position-context-in-document";
import { LitAnalyzerRequest } from "../../lit-analyzer-context";
import { LitCompletion } from "../../types/lit-completion";
import { LitCompletionDetails } from "../../types/lit-completion-details";
import { DefinitionKind, LitDefinition } from "../../types/lit-definition";
import { LitCssDiagnostic } from "../../types/lit-diagnostic";
import { LitQuickInfo } from "../../types/lit-quick-info";
import { LitCssVscodeService } from "./lit-css-vscode-service";

export class LitCssDocumentAnalyzer {
	private vscodeCssService = new LitCssVscodeService();
	private completionsCache: LitCompletion[] = [];

	getCompletionDetailsAtOffset(document: CssDocument, offset: number, name: string, request: LitAnalyzerRequest): LitCompletionDetails | undefined {
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

	getCompletionsAtOffset(document: CssDocument, offset: number, request: LitAnalyzerRequest): LitCompletion[] {
		this.completionsCache = this.vscodeCssService.getCompletions(document, offset, request);
		return this.completionsCache;
	}

	getQuickInfoAtOffset(document: CssDocument, offset: number, request: LitAnalyzerRequest): LitQuickInfo | undefined {
		return this.vscodeCssService.getQuickInfo(document, offset, request);
	}

	getDiagnostics(document: CssDocument, request: LitAnalyzerRequest): LitCssDiagnostic[] {
		return this.vscodeCssService.getDiagnostics(document, request);
	}

	getDefinitionAtOffset(document: CssDocument, offset: number, request: LitAnalyzerRequest): LitDefinition | undefined {
		const positionContext = getPositionContextInDocument(document, offset);
		const tagNameMatch = positionContext.word.match(/^[a-zA-Z-1-9]+/);
		if (tagNameMatch == null) return undefined;
		const tagName = tagNameMatch[0];
		const definition = request.definitionStore.getDefinitionForTagName(tagName);

		if (definition != null) {
			const start = offset - positionContext.leftWord.length;
			const end = start + tagName.length;

			return {
				kind: DefinitionKind.COMPONENT,
				fromRange: { document, start, end },
				target: definition.declaration
			};
		}
		return undefined;
	}
}
