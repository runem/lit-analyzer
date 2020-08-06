import {
	HtmlAttr,
	HtmlAttrTarget,
	HtmlCssPart,
	HtmlCssProperty,
	HtmlEvent,
	HtmlMember,
	HtmlProp,
	HtmlSlot,
	HtmlTag,
	HtmlDataCollection
} from "../parse/parse-html-data/html-tag";
import {
	HtmlNodeAttr,
	IHtmlNodeAttr,
	IHtmlNodeAttrEventListener,
	IHtmlNodeAttrProp,
	IHtmlNodeBooleanAttribute
} from "../types/html-node/html-node-attr-types";
import { HtmlNode } from "../types/html-node/html-node-types";
import { HtmlDataSourceKind } from "./html-store/html-data-source-merged";

export interface AnalyzerHtmlStore {
	/*absorbAnalysisResult(sourceFile: SourceFile, result: AnalyzeComponentsResult): void;
	 absorbSubclassExtension(name: string, extension: HtmlTag): void;
	 absorbCollection(collection: HtmlDataCollection, register: HtmlStoreDataSource): void;
	 forgetTagsDefinedInFile(sourceFile: SourceFile): void;*/

	/*getDefinitionsWithDeclarationInFile(sourceFile: SourceFile): ComponentDefinition[];
	getDefinitionForTagName(tagName: string): ComponentDefinition | undefined;
	getDefinitionsInFile(sourceFile: SourceFile): ComponentDefinition[];
	hasTagNameBeenImported(fileName: string, tagName: string): boolean;*/
	absorbCollection(collection: HtmlDataCollection, register: HtmlDataSourceKind): void;
	getHtmlTag(htmlNode: HtmlNode | string): HtmlTag | undefined;
	getGlobalTags(): Iterable<HtmlTag>;
	getAllAttributesForTag(htmlNode: HtmlNode | string): Iterable<HtmlAttr>;
	getAllPropertiesForTag(htmlNode: HtmlNode | string): Iterable<HtmlProp>;
	getAllEventsForTag(htmlNode: HtmlNode | string): Iterable<HtmlEvent>;
	getAllSlotsForTag(htmlNode: HtmlNode | string): Iterable<HtmlSlot>;
	getAllCssPartsForTag(htmlNode: HtmlNode | string): Iterable<HtmlCssPart>;
	getAllCssPropertiesForTag(htmlNode: HtmlNode | string): Iterable<HtmlCssProperty>;

	getHtmlAttrTarget(htmlNodeAttr: IHtmlNodeAttrProp): HtmlProp | undefined;
	getHtmlAttrTarget(htmlNodeAttr: IHtmlNodeAttr | IHtmlNodeBooleanAttribute): HtmlAttr | undefined;
	getHtmlAttrTarget(htmlNodeAttr: IHtmlNodeAttr | IHtmlNodeBooleanAttribute | IHtmlNodeAttrProp): HtmlMember | undefined;
	getHtmlAttrTarget(htmlNodeAttr: IHtmlNodeAttrEventListener): HtmlEvent | undefined;
	getHtmlAttrTarget(htmlNodeAttr: HtmlNodeAttr): HtmlAttrTarget | undefined;
	getHtmlAttrTarget(htmlNodeAttr: HtmlNodeAttr): HtmlAttrTarget | undefined;
}
