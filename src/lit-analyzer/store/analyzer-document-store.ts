import { SourceFile } from "typescript";
import { TextDocument } from "../parse/document/text-document/text-document";
import { LitAnalyzerConfig } from "../lit-analyzer-config";

export interface AnalyzerDocumentStore {
	getDocumentAtPosition(sourceFile: SourceFile, position: number, options: LitAnalyzerConfig): TextDocument | undefined;
	getDocumentsInFile(sourceFile: SourceFile, config: LitAnalyzerConfig): TextDocument[];
}
