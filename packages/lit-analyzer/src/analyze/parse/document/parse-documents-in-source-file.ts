import { SourceFile, TaggedTemplateExpression } from "typescript";
import { flatten, intersects } from "../../util/general-util";
import { findTaggedTemplates } from "../tagged-template/find-tagged-templates";
import { CssDocument } from "./text-document/css-document/css-document";
import { HtmlDocument } from "./text-document/html-document/html-document";
import { parseHtmlDocument } from "./text-document/html-document/parse-html-document";
import { HtmlNodeKind, IHtmlNodeStyleTag } from "../../types/html-node/html-node-types";
import { TextDocument } from "./text-document/text-document";
import { VirtualAstCssDocument } from "./virtual-document/virtual-css-document";

export interface ParseDocumentOptions {
	cssTags: string[];
	htmlTags: string[];
}

export function parseDocumentsInSourceFile(sourceFile: SourceFile, options: ParseDocumentOptions): TextDocument[];
export function parseDocumentsInSourceFile(sourceFile: SourceFile, options: ParseDocumentOptions, position: number): TextDocument | undefined;
export function parseDocumentsInSourceFile(
	sourceFile: SourceFile,
	options: ParseDocumentOptions,
	position?: number
): TextDocument[] | TextDocument | undefined {
	// Parse html tags in the relevant source file
	const templateTags = [...options.cssTags, ...options.htmlTags];
	const taggedTemplates = findTaggedTemplates(sourceFile, templateTags, position);

	let result: TextDocument[] | TextDocument | undefined = undefined;

	if (taggedTemplates == null) {
		return undefined;
	} else if (Array.isArray(taggedTemplates)) {
		result = taggedTemplates.map(t => taggedTemplateToDocument(t, options));
	} else {
		result = taggedTemplateToDocument(taggedTemplates, options);
	}

	if (result == null) return undefined;

	if (Array.isArray(result)) {
		return flatten(result.map(document => [document, ...(unpackHtmlDocument(document, position) || [])]));
	} else {
		const nestedDocuments = unpackHtmlDocument(result, position);
		if (position != null && nestedDocuments != null) {
			return nestedDocuments;
		}
	}

	return result;
}

function taggedTemplateToDocument(taggedTemplate: TaggedTemplateExpression, { cssTags }: ParseDocumentOptions): TextDocument {
	const tag = taggedTemplate.tag.getText();
	if (cssTags.includes(tag)) {
		return new CssDocument(new VirtualAstCssDocument(taggedTemplate));
	} else {
		return parseHtmlDocument(taggedTemplate);
	}
}

function unpackHtmlDocument(textDocument: TextDocument, position?: number): TextDocument | undefined;
function unpackHtmlDocument(textDocument: TextDocument): TextDocument[];
function unpackHtmlDocument(textDocument: TextDocument, position?: number): TextDocument[] | TextDocument | undefined {
	const documents: TextDocument[] = [];

	if (textDocument instanceof HtmlDocument) {
		for (const rootNode of textDocument.rootNodes) {
			if (rootNode.kind === HtmlNodeKind.STYLE && rootNode.location.endTag != null) {
				if (position == null) {
					const nestedDocument = styleHtmlNodeToCssDocument(textDocument, rootNode);
					if (nestedDocument != null) {
						documents.push(nestedDocument);
					}
				} else if (
					intersects(textDocument.virtualDocument.scPositionToOffset(position), {
						start: rootNode.location.startTag.end,
						end: rootNode.location.endTag.start
					})
				) {
					return styleHtmlNodeToCssDocument(textDocument, rootNode);
				}
			}
		}
	}

	if (position != null) return undefined;

	return documents;
}

function styleHtmlNodeToCssDocument(htmlDocument: HtmlDocument, styleNode: IHtmlNodeStyleTag): CssDocument | undefined {
	if (styleNode.location.endTag == null) return undefined;

	const cssDocumentParts = htmlDocument.virtualDocument.getPartsAtOffsetRange({
		start: styleNode.location.startTag.end,
		end: styleNode.location.endTag.start
	});

	const cssVirtualDocument = new VirtualAstCssDocument(
		cssDocumentParts,
		{
			start: htmlDocument.virtualDocument.offsetToSCPosition(styleNode.location.startTag.end),
			end: htmlDocument.virtualDocument.offsetToSCPosition(styleNode.location.endTag.start)
		},
		htmlDocument.virtualDocument.fileName
	);

	return new CssDocument(cssVirtualDocument);
}
