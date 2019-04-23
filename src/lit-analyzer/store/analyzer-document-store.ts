import { SourceFile } from "typescript";
import { TextDocument } from "../../parsing/text-document/text-document";
import { LitPluginConfig } from "../../state/lit-plugin-config";

export interface AnalyzerDocumentStore {
	getDocumentAtPosition(sourceFile: SourceFile, position: number, options: LitPluginConfig): TextDocument | undefined;
	getDocumentsInFile(sourceFile: SourceFile, config: LitPluginConfig): TextDocument[];
}
