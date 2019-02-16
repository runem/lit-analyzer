import { SourceFile } from "typescript";
import { TsLitPluginStore } from "../state/store";

export interface DiagnosticsContext {
	sourceFile: SourceFile;
	store: TsLitPluginStore;
}
