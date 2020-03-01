import { SourceFile } from "typescript";
import { LitAnalyzerConfig } from "../../lit-analyzer-config";
import { parseDocumentsInSourceFile } from "../../parse/document/parse-documents-in-source-file";
import { TextDocument } from "../../parse/document/text-document/text-document";
import { SourceFilePosition } from "../../types/range";
import { AnalyzerDocumentStore } from "../analyzer-document-store";

export class DefaultAnalyzerDocumentStore implements AnalyzerDocumentStore {
	getDocumentAtPosition(sourceFile: SourceFile, position: SourceFilePosition, options: LitAnalyzerConfig): TextDocument | undefined {
		return parseDocumentsInSourceFile(
			sourceFile,
			{
				htmlTags: options.htmlTemplateTags,
				cssTags: options.cssTemplateTags
			},
			position
		);
	}

	getDocumentsInFile(sourceFile: SourceFile, config: LitAnalyzerConfig): TextDocument[] {
		return parseDocumentsInSourceFile(sourceFile, {
			htmlTags: config.htmlTemplateTags,
			cssTags: config.cssTemplateTags
		});
	}
}
