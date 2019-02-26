import { tsModule } from "../../ts-module";
import { CustomElementFlavor } from "./flavors/custom-element/custom-element-flavor";
import { LitElementFlavor } from "./flavors/lit-element/lit-element-flavor";
import { ParseVisitContext } from "./flavors/parse-component-flavor";
import { parseComponentDefinitions, parseEventDefinitions } from "./parse/parse";
import { ComponentParsingDiagnostic } from "./types/component-diagnostics";
import { ComponentParsingResult } from "./types/component-parsing-result";
import { SourceFile, TypeChecker } from "typescript";

export function parseComponentsInFile(sourceFile: SourceFile, checker: TypeChecker, flavors = [new CustomElementFlavor(), new LitElementFlavor()]): ComponentParsingResult {
	const diagnostics: ComponentParsingDiagnostic[] = [];
	const context: ParseVisitContext = {
		checker,
		ts: tsModule.ts,
		emitDiagnostics(diagnostic: ComponentParsingDiagnostic): void {
			diagnostics.push(diagnostic);
		}
	};

	const componentDefinitions = parseComponentDefinitions(sourceFile, flavors, context);
	const eventDefinitions = parseEventDefinitions(sourceFile, flavors, context);

	return {
		sourceFile,
		eventDefinitions,
		componentDefinitions,
		diagnostics
	};
}
