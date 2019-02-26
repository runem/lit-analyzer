import { SourceFile } from "typescript";
import { ComponentParsingDiagnostic } from "./component-diagnostics";
import { ComponentDefinition } from "./component-types";
import { EventDefinition } from "./event-types";

export interface ComponentParsingResult {
	sourceFile: SourceFile;
	componentDefinitions: ComponentDefinition[];
	eventDefinitions: EventDefinition[];
	diagnostics: ComponentParsingDiagnostic[];
}
