export interface AnalyzerDependencyStore {
	hasTagNameBeenImported(fileName: string, tagName: string): boolean;
}
