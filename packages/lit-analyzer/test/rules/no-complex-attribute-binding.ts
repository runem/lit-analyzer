import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { makeElement } from "../helpers/generate-test-file";
import { tsTest } from "../helpers/ts-test";

tsTest("Complex types are not assignable using an attribute binding", t => {
	const { diagnostics } = getDiagnostics('html`<input placeholder="${{foo: "bar"}}" />`');
	hasDiagnostic(t, diagnostics, "no-complex-attribute-binding");
});

tsTest("Complex types are assignable using a property binding", t => {
	const { diagnostics } = getDiagnostics('html`<input .placeholder="${{foo: "bar"}}" />`');
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Primitives are not assignable to complex type using an attribute binding", t => {
	const { diagnostics } = getDiagnostics([makeElement({ properties: ["complex = {foo: string}"] }), 'html`<my-element complex="bar"></my-element>`']);
	hasDiagnostic(t, diagnostics, "no-complex-attribute-binding");
});

tsTest("Complex types are assignable using property binding", t => {
	const { diagnostics } = getDiagnostics([
		makeElement({ properties: ["complex = {foo: string}"] }),
		'html`<my-element .complex="${{foo: "bar"}}"></my-element>`'
	]);
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Don't check for the assignability of complex types in attribute bindings if the type is a custom lit directive", t => {
	const { diagnostics } = getDiagnostics(
		'type Part = {}; type ifExists = (val: any) => (part: Part) => void; html`<input maxlength="${ifExists(123)}" />`'
	);
	hasNoDiagnostics(t, diagnostics);
});
