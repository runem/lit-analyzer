import { parseDocumentsInSourceFile } from "../../parse/document/parse-documents-in-source-file";
import { TextDocument } from "../../parse/document/text-document/text-document";
import { LitAnalyzerConfig } from "../../lit-analyzer-config";
import { SourceFile } from "typescript";

export class DefaultAnalyzerDocumentStore {
	getDocumentAtPosition(sourceFile: SourceFile, position: number, options: LitAnalyzerConfig): TextDocument | undefined {
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
