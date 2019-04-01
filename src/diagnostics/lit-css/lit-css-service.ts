import { CssDocument } from "../../parsing/text-document/css-document/css-document";
import { getPositionContextInDocument } from "../../util/get-html-position";
import { DiagnosticsContext } from "../diagnostics-context";
import { LitCompletion } from "../types/lit-completion";
import { LitCompletionDetails } from "../types/lit-completion-details";
import { DefinitionKind, LitDefinition } from "../types/lit-definition";
import { LitCssDiagnostic } from "../types/lit-diagnostic";
import { LitQuickInfo } from "../types/lit-quick-info";
import { VscodeCssService } from "./vscode-css-service";

export class LitCssService {
	vscodeCssService = new VscodeCssService();

	getCompletionDetails(document: CssDocument, offset: number, name: string, context: DiagnosticsContext): LitCompletionDetails | undefined {
		const completionWithName = this.vscodeCssService.getCompletions(document, offset, context).find(completion => completion.name === name);

		if (completionWithName == null || completionWithName.documentation == null) return undefined;

		const primaryInfo = completionWithName.documentation();
		if (primaryInfo == null) return undefined;

		return {
			name,
			kind: completionWithName.kind,
			primaryInfo
		};
	}

	getCompletions(document: CssDocument, offset: number, context: DiagnosticsContext): LitCompletion[] {
		return this.vscodeCssService.getCompletions(document, offset, context);
	}

	getQuickInfo(document: CssDocument, offset: number, context: DiagnosticsContext): LitQuickInfo | undefined {
		return this.vscodeCssService.getQuickInfo(document, offset, context);
	}

	getDiagnostics(document: CssDocument, context: DiagnosticsContext): LitCssDiagnostic[] {
		return this.vscodeCssService.getDiagnostics(document, context);
	}

	getDefinition(document: CssDocument, offset: number, context: DiagnosticsContext): LitDefinition | undefined {
		const positionContext = getPositionContextInDocument(document, offset);
		const tagNameMatch = positionContext.word.match(/^[a-zA-Z-1-9]+/);
		if (tagNameMatch == null) return undefined;
		const tagName = tagNameMatch[0];
		const definition = context.store.getDefinitionForTagName(tagName);

		if (definition != null) {
			const start = offset - positionContext.leftWord.length;
			const end = start + tagName.length;

			return {
				kind: DefinitionKind.COMPONENT,
				fromRange: { start, end },
				target: definition.declaration
			};
		}
		return undefined;
	}
}
