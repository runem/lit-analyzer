import { DiagnosticWithLocation } from "typescript";
import { diagnosticsForHtmlAttrReport, diagnosticsForHtmlNodeReport } from "../../extensions/html/diagnostics";
import { HtmlDocumentCollection } from "../../parsing/html-document/html-document-collection";
import { TsLitPluginStore } from "../../state/store";
import { flatten } from "../../util/util";

/**
 * Returns diagnostics for html documents using the extensions.
 * @param collection
 * @param store
 */
export function getDiagnosticsFromHtmlDocuments(collection: HtmlDocumentCollection, store: TsLitPluginStore): DiagnosticWithLocation[] {
	return flatten(
		collection.htmlDocuments.map(htmlDocument => {
			return flatten(
				htmlDocument.mapNodes(htmlNode => {
					return [
						...flatten(store.getReportsForHtmlNodeOrAttr(htmlNode).map(htmlReport => diagnosticsForHtmlNodeReport(htmlNode, htmlReport, collection.sourceFile, store))),

						...flatten(
							htmlNode.attributes.map(htmlAttr =>
								flatten(store.getReportsForHtmlNodeOrAttr(htmlAttr).map(htmlReport => diagnosticsForHtmlAttrReport(htmlAttr, htmlReport, collection.sourceFile, store)))
							)
						)
					];
				})
			);
		})
	);
}
