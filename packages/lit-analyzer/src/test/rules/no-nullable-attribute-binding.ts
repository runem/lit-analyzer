import { getDiagnostics } from "../helpers/analyze.js";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert.js";
import { makeElement } from "../helpers/generate-test-file.js";
import { tsTest } from "../helpers/ts-test.js";

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

tsTest("Can pass 'null' through ifDefined in attribute binding", t => {
	const { diagnostics } = getDiagnostics(
		'import {ifDefined} from "lit/directives/if-defined.js";\nhtml`<input maxlength="${ifDefined({} as number | null)}" />`'
	);
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Can pass 'null' through ??nothing in attribute binding", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${({} as number | null) ?? nothing}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Can assign 'null' in property binding", t => {
	const { diagnostics } = getDiagnostics('html`<input .selectionEnd="${{} as number | null}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Message for 'null' in attribute detects null type correctly", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${{} as number | null}" />`');
	hasDiagnostic(t, diagnostics, "no-nullable-attribute-binding");

	t.true(diagnostics[0].message.includes("can end up binding the string 'null'"));
});

tsTest("Message for 'undefined' in attribute detects undefined type correctly", t => {
	const { diagnostics } = getDiagnostics('html`<input maxlength="${{} as number | undefined}" />`');
	hasDiagnostic(t, diagnostics, "no-nullable-attribute-binding");

	t.true(diagnostics[0].message.includes("can end up binding the string 'undefined'"));
});
