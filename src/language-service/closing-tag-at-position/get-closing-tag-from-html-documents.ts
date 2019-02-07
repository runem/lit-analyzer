import { JsxClosingTagInfo } from "typescript";
import { HtmlDocumentCollection } from "../../html-document/html-document-collection";
import { TsHtmlPluginStore } from "../../state/store";
import { VscodeHtmlServiceWrapper } from "../../vscode-html-languageservice/vscode-html-service-wrapper";

/**
 * Returns closing tag information based on html documents.
 * @param documentCollection
 * @param position
 * @param store
 */
export function getClosingTagFromHtmlDocuments(documentCollection: HtmlDocumentCollection, position: number, store: TsHtmlPluginStore): JsxClosingTagInfo | undefined {
	const htmlDocument = documentCollection.intersectingHtmlDocument(position);
	if (htmlDocument == null) return;

	const wrapper = new VscodeHtmlServiceWrapper(htmlDocument);
	return wrapper.doTagComplete(position);
}
