import { SourceFile, TypeChecker } from "typescript";
import { TsLitPluginStore } from "../state/store";

export interface DiagnosticsContext {
	sourceFile: SourceFile;
	store: TsLitPluginStore;
	checker: TypeChecker;
}
