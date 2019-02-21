import { SourceFile, TypeChecker } from "typescript";

export interface ParsingContext {
	checker: TypeChecker;
	sourceFile: SourceFile;
}
