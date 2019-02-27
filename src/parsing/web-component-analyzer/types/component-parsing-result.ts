import { SourceFile } from "typescript";
import { ComponentParsingDiagnostic } from "./component-diagnostics";
import { ComponentDefinition } from "./component-types";
import { EventDeclaration } from "./event-types";

export interface ComponentParsingResult {
	sourceFile: SourceFile;
	componentDefinitions: ComponentDefinition[];
	globalEvents: EventDeclaration[];
	diagnostics: ComponentParsingDiagnostic[];
}
