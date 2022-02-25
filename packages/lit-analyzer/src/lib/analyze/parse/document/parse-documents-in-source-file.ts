import { SourceFile, TaggedTemplateExpression } from "typescript";
import { HtmlNodeKind, IHtmlNodeStyleTag } from "../../types/html-node/html-node-types.js";
import { SourceFilePosition } from "../../types/range.js";
import { arrayFlat } from "../../util/array-util.js";
import { documentRangeToSFRange, intersects, makeDocumentRange } from "../../util/range-util.js";
import { findTaggedTemplates } from "../tagged-template/find-tagged-templates.js";
import { CssDocument } from "./text-document/css-document/css-document.js";
import { HtmlDocument } from "./text-document/html-document/html-document.js";
import { parseHtmlDocument } from "./text-document/html-document/parse-html-document.js";
import { TextDocument } from "./text-document/text-document.js";
import { VirtualAstCssDocument } from "./virtual-document/virtual-css-document.js";

export interface ParseDocumentOptions {
	cssTags: string[];
	htmlTags: string[];
}

export function parseDocumentsInSourceFile(sourceFile: SourceFile, options: ParseDocumentOptions): TextDocument[];
export function parseDocumentsInSourceFile(
	sourceFile: SourceFile,
	options: ParseDocumentOptions,
	position: SourceFilePosition
): TextDocument | undefined;
export function parseDocumentsInSourceFile(
	sourceFile: SourceFile,
	options: ParseDocumentOptions,
	position?: SourceFilePosition
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
		return arrayFlat(
			result.map(document => {
				const res = unpackHtmlDocument(document, position);
				return [document, ...(res == null ? [] : Array.isArray(res) ? res : [res])];
			})
		);
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

function unpackHtmlDocument(textDocument: TextDocument, position: SourceFilePosition): TextDocument | undefined;
function unpackHtmlDocument(textDocument: TextDocument, position?: SourceFilePosition): TextDocument | TextDocument[];
function unpackHtmlDocument(textDocument: TextDocument, position?: SourceFilePosition): TextDocument[] | TextDocument | undefined {
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
					intersects(textDocument.virtualDocument.sfPositionToDocumentOffset(position), {
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

	const cssDocumentParts = htmlDocument.virtualDocument.getPartsAtDocumentRange(
		makeDocumentRange({
			start: styleNode.location.startTag.start,
			end: styleNode.location.endTag.start
		})
	);

	const cssVirtualDocument = new VirtualAstCssDocument(
		cssDocumentParts,
		documentRangeToSFRange(htmlDocument, styleNode.location.startTag),
		htmlDocument.virtualDocument.fileName
	);

	return new CssDocument(cssVirtualDocument);
}
