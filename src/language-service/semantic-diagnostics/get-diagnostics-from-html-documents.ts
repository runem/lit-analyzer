import { DiagnosticWithLocation } from "typescript";
import { HtmlDocumentCollection } from "../../html-document/html-document-collection";
import { TsHtmlPluginStore } from "../../state/store";
import { flatten } from "../../util/util";

/**
 * Returns diagnostics for html documents using the extensions.
 * @param collection
 * @param store
 */
export function getDiagnosticsFromHtmlDocuments(collection: HtmlDocumentCollection, store: TsHtmlPluginStore): DiagnosticWithLocation[] {
	const context = {
		file: collection.sourceFile,
		store
	};

	return flatten(
		collection.htmlDocuments.map(htmlDocument => {
			return flatten(
				htmlDocument.mapNodes(htmlNode => {
					return [
						...flatten(store.getReportsForHtmlNodeOrAttr(htmlNode).map(htmlReport => store.extension.diagnosticsForHtmlNodeReport(htmlNode, htmlReport, context) || [])),

						...flatten(
							htmlNode.attributes.map(htmlAttr =>
								flatten(store.getReportsForHtmlNodeOrAttr(htmlAttr).map(htmlReport => store.extension.diagnosticsForHtmlAttrReport(htmlAttr, htmlReport, context) || []))
							)
						)
					];
				})
			);
		})
	);
}
