import { basename, dirname, relative } from "path";
import { HtmlDocument } from "../../../parsing/text-document/html-document/html-document";
import { HtmlNode, HtmlNodeKind } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-types";
import { TsLitPluginStore } from "../../../state/store";
import { findBestStringMatch } from "../../../util/find-best-match";
import { isCustomElementTagName } from "../../../util/util";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../../types/lit-diagnostic";

export function validateHtmlNode(htmlDocument: HtmlDocument, htmlNode: HtmlNode, store: TsLitPluginStore): LitHtmlDiagnostic[] {
	const reports: LitHtmlDiagnostic[] = [];

	if (!htmlNode.selfClosed && htmlNode.location.endTag == null) {
		reports.push({
			kind: LitHtmlDiagnosticKind.TAG_NOT_CLOSED,
			message: "This tag isn't closed.",
			severity: "error",
			location: htmlNode.location.name,
			htmlNode
		});
	}

	// Don't validate style and svg yet
	if (htmlNode.kind !== HtmlNodeKind.NODE) return [];

	const htmlTag = store.getHtmlTag(htmlNode);

	if (htmlTag == null) {
		if (store.config.skipUnknownHtmlTags) return [];

		const suggestedName = findBestStringMatch(htmlNode.tagName, Array.from(store.getGlobalTags()).map(tag => tag.tagName));

		reports.push({
			kind: LitHtmlDiagnosticKind.UNKNOWN_TAG,
			message: `Unknown tag "${htmlNode.tagName}"${suggestedName ? `. Did you mean '${suggestedName}'?` : ""}`,
			location: htmlNode.location.name,
			severity: "warning",
			htmlNode,
			suggestedName
		});
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
		if (!store.config.skipMissingImports) {
			const isCustomElement = isCustomElementTagName(htmlNode.tagName);
			const fromFileName = htmlDocument.virtualDocument.fileName;
			const isDefinitionImported = store.hasTagNameBeenImported(fromFileName, htmlNode.tagName);

			const definition = store.getDefinitionForTagName(htmlNode.tagName);

			if (isCustomElement && !isDefinitionImported && definition != null) {
				// Get the import path and the position where it can be placed
				const importPath = getRelativePathForImport(fromFileName, definition.node.getSourceFile().fileName);

				reports.push({
					kind: LitHtmlDiagnosticKind.MISSING_IMPORT,
					message: `Missing import <${htmlNode.tagName}>: ${definition.declaration.className || ""}`,
					severity: "warning",
					location: htmlNode.location.name,
					htmlNode,
					definition,
					importPath
				});
			}
		}
	}

	// Check for slots
	const slots = htmlNode.parent && Array.from(store.getAllSlotsForTag(htmlNode.parent.tagName));
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
					location: htmlNode.location.name
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
