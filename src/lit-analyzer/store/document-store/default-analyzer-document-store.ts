import { parseDocumentsInSourceFile } from "../../../parsing/parse-documents-in-source-file";
import { TextDocument } from "../../../parsing/text-document/text-document";
import { LitPluginConfig } from "../../../state/lit-plugin-config";
import { SourceFile } from "typescript";

export class DefaultAnalyzerDocumentStore {
	getDocumentAtPosition(sourceFile: SourceFile, position: number, options: LitPluginConfig): TextDocument | undefined {
		return parseDocumentsInSourceFile(
			sourceFile,
			{
				htmlTags: options.htmlTemplateTags,
				cssTags: options.cssTemplateTags
			},
			position
		);
	}

	getDocumentsInFile(sourceFile: SourceFile, config: LitPluginConfig): TextDocument[] {
		return parseDocumentsInSourceFile(sourceFile, {
			htmlTags: config.htmlTemplateTags,
			cssTags: config.cssTemplateTags
		});
	}
}
