import { basename, dirname, relative } from "path";
import { HtmlNode, HtmlNodeKind } from "../../../types/html-node/html-node-types";
import { findBestStringMatch } from "../../../util/find-best-match";
import { isCustomElementTagName } from "../../../util/general-util";
import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../../../types/lit-diagnostic";

export function validateHtmlNode(htmlNode: HtmlNode, { document, htmlStore, config, dependencyStore, definitionStore }: LitAnalyzerRequest): LitHtmlDiagnostic[] {
	const reports: LitHtmlDiagnostic[] = [];

	if (!htmlNode.selfClosed && htmlNode.location.endTag == null) {
		const isCustomElement = isCustomElementTagName(htmlNode.tagName);
		reports.push({
			kind: LitHtmlDiagnosticKind.TAG_NOT_CLOSED,
			message: `This tag isn't closed.${isCustomElement ? " Custom elements cannot be self closing." : ""}`,
			severity: "error",
			location: { document, ...htmlNode.location.name },
			htmlNode
		});
	}

	// Don't validate style and svg yet
	if (htmlNode.kind !== HtmlNodeKind.NODE) return [];

	const htmlTag = htmlStore.getHtmlTag(htmlNode);

	if (htmlTag == null) {
		if (config.skipUnknownTags) return [];

		const suggestedName = findBestStringMatch(htmlNode.tagName, Array.from(htmlStore.getGlobalTags()).map(tag => tag.tagName));

		const report: LitHtmlDiagnostic = {
			kind: LitHtmlDiagnosticKind.UNKNOWN_TAG,
			message: `Unknown tag <${htmlNode.tagName}>${suggestedName ? `. Did you mean <${suggestedName}>?` : ""}`,
			location: { document, ...htmlNode.location.name },
			severity: "warning",
			suggestion: `Check that you've imported the element, and that it's declared on the HTMLElementTagNameMap.`,
			htmlNode,
			suggestedName
		};
		if (!config.dontSuggestConfigChanges) {
			report.suggestion += ` If it can't be imported, consider adding it to the 'globalTags' plugin configuration or disabling the check using 'skipUnknownTags'.`;
		}

		reports.push(report);
	} else if (htmlTag.declaration != null) {
		//const declaration = htmlTag.declaration;

		// Find missing attributes on the node
		// TODO
		/*const missingRequiredAttrs = htmlTag.attributes.filter(attr => attr.required && htmlNode.attributes.find(a => caseInsensitiveCmp(a.name, attr.name)) == null);

		 // Add missing "missing props" report if necessary.
		 if (missingRequiredAttrs.length > 0) {
		 reports.push({
		 kind: LitHtmlDiagnosticKind.MISSING_REQUIRED_ATTRS,
		 message: `Missing required attributes: ${missingRequiredAttrs.map(p => `${p.name}`).join(", ")}`,
		 severity: "warning",
		 location: htmlNode.location.name,
		 htmlNode,
		 attrs: missingRequiredAttrs
		 });
		 }*/

		// Check if this element is imported
		if (!config.skipMissingImports) {
			const isCustomElement = isCustomElementTagName(htmlNode.tagName);
			const fromFileName = document.virtualDocument.fileName;
			const isDefinitionImported = dependencyStore.hasTagNameBeenImported(fromFileName, htmlNode.tagName);

			const definition = definitionStore.getDefinitionForTagName(htmlNode.tagName);

			if (isCustomElement && !isDefinitionImported && definition != null) {
				// Get the import path and the position where it can be placed
				const importPath = getRelativePathForImport(fromFileName, definition.node.getSourceFile().fileName);

				const report: LitHtmlDiagnostic = {
					kind: LitHtmlDiagnosticKind.MISSING_IMPORT,
					message: `Missing import for <${htmlNode.tagName}>: ${definition.declaration.className || ""}`,
					suggestion: `You can disable this check using 'skipMissingImports'`,
					severity: "warning",
					location: { document, ...htmlNode.location.name },
					htmlNode,
					definition,
					importPath
				};
				if (config.dontSuggestConfigChanges) {
					report.suggestion = undefined;
				}
				reports.push(report);
			}
		}
	}

	// Check for slots
	const slots = htmlNode.parent && Array.from(htmlStore.getAllSlotsForTag(htmlNode.parent.tagName));
	if (slots != null && slots.length > 0) {
		const slotAttr = htmlNode.attributes.find(a => a.name === "slot");
		if (slotAttr == null) {
			const unnamedSlot = slots.find(s => s.name === "");
			if (unnamedSlot == null) {
				reports.push({
					kind: LitHtmlDiagnosticKind.MISSING_SLOT_ATTRIBUTE,
					validSlotNames: slots.map(s => s.name!),
					htmlNode,
					message: `Missing slot attribute. Parent element <${htmlNode.tagName}> only allows named slots as children.`,
					severity: "warning",
					location: { document, ...htmlNode.location.name }
				});
			}
		}
	}

	return reports;
}

/**
 * Returns a relative path from a file path to another file path.
 * This path can be used in an import statement.
 * @param fromFileName
 * @param toFileName
 */
function getRelativePathForImport(fromFileName: string, toFileName: string): string {
	const path = relative(dirname(fromFileName), dirname(toFileName));
	const filenameWithoutExt = basename(toFileName).replace(/\.[^/.]+$/, "");
	const importPath = `./${path ? `${path}/` : ""}${filenameWithoutExt}`;
	return importPath
		.replace(/^.*node_modules\//, "")
		.replace(/\.d$/, "")
		.replace(/\/index$/, "");
}
