import { SourceFile } from "typescript";
import { LitAnalyzerConfig } from "../lit-analyzer-config";
import { TextDocument } from "../parse/document/text-document/text-document";
import { SourceFilePosition } from "../types/range";

export interface AnalyzerDocumentStore {
	getDocumentAtPosition(sourceFile: SourceFile, position: SourceFilePosition, options: LitAnalyzerConfig): TextDocument | undefined;
	getDocumentsInFile(sourceFile: SourceFile, config: LitAnalyzerConfig): TextDocument[];
}
