import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { makeElement } from "../helpers/generate-test-file";
import { tsTest } from "../helpers/ts-test";

tsTest("Cannot assign 'undefined' in attribute binding", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${{} as number | undefined}" />`');
	hasDiagnostic(t, diagnostics, "no-nullable-attribute-binding");
});

tsTest("Can assign 'undefined' in property binding", t => {
	const { diagnostics } = getDiagnostics([
		makeElement({ slots: ["foo: number | undefined"] }),
		'html`<my-element .foo="${{} as number | undefined}" />`'
	]);
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Cannot assign 'null' in attribute binding", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${{} as number | null}" />`');
	hasDiagnostic(t, diagnostics, "no-nullable-attribute-binding");
});

tsTest("Can assign 'null' in property binding", t => {
	const { diagnostics } = getDiagnostics('html`<input .selectionEnd="${{} as number | null}" />`');
	hasNoDiagnostics(t, diagnostics);
});
