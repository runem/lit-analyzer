import { SourceFile, TypeChecker } from "typescript";
import { TsLitPluginStore } from "../state/store";

export interface ParsingContext {
	checker: TypeChecker;
	sourceFile: SourceFile;
	store: TsLitPluginStore;
}
