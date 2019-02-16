import { TsLitPluginStore } from "../../state/store";
import { HtmlNode } from "../../types/html-node-types";
import { HtmlReport, HtmlReportKind } from "../../types/html-report-types";
import { findBestMatch } from "../../util/find-best-match";
import { SourceFile } from "typescript";

export function validateHtmlNode(htmlNode: HtmlNode, sourceFile: SourceFile, store: TsLitPluginStore): HtmlReport[] {
	const reports: HtmlReport[] = [];

	if (!htmlNode.selfClosed && htmlNode.location.endTag == null) {
		reports.push({
			kind: HtmlReportKind.TAG_NOT_CLOSED
		});
	}

	const htmlTag = store.getHtmlTag(htmlNode);
	const declaration = store.getComponentDeclaration(htmlNode);

	if (htmlTag == null) {
		if (store.config.externalHtmlTagNames.includes(htmlNode.tagName)) return [];

		if (store.config.skipUnknownHtmlTags) return [];

		const suggestedName = findBestMatch(htmlNode.tagName, store.allHtmlTags.map(tag => tag.name));

		reports.push({
			kind: HtmlReportKind.UNKNOWN,
			suggestedName
		});
	} else if (declaration != null) {
		// Find missing attributes on the node
		const attrs = htmlNode.attributes.map(a => a.name);

		const missingRequiredProps = declaration.props.filter(prop => prop.required).filter(prop => !attrs.includes(prop.name.toLowerCase()));

		// Add missing "missing props" report if necessary.
		if (missingRequiredProps.length > 0) {
			reports.push({
				kind: HtmlReportKind.MISSING_PROPS,
				props: missingRequiredProps
			});
		}

		// Check if this element is imported
		if (!store.config.skipMissingImports) {
			const isDefinitionImported = store.hasTagNameBeenImported(sourceFile.fileName, htmlNode.tagName);

			if (!isDefinitionImported) {
				reports.push({ kind: HtmlReportKind.MISSING_IMPORT });
			}
		}
	}

	return reports;
}
