import { getDiagnostics } from "../helpers/analyze.js";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert.js";
import { makeElement } from "../helpers/generate-test-file.js";
import { tsTest } from "../helpers/ts-test.js";

tsTest("Complex types are not assignable using an attribute binding", t => {
	const { diagnostics } = getDiagnostics('html`<input placeholder="${{foo: "bar"}}" />`');
	hasDiagnostic(t, diagnostics, "no-complex-attribute-binding");
});

tsTest("Complex types are assignable using a property binding", t => {
	const { diagnostics } = getDiagnostics('html`<input .onclick="${() => {}}" />`');
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

tsTest("Ignore element expressions", t => {
	const { diagnostics } = getDiagnostics("html`<input ${{x: 1}} />`", { rules: { "no-incompatible-type-binding": false } });
	hasNoDiagnostics(t, diagnostics);
});

tsTest("Complex types are assignable to attributes using converters", t => {
	const { diagnostics } = getDiagnostics(
		[
			makeElement({
				properties: {
					"complex: string[]": `{
					converter: {
						fromAttribute(str) { return str.split(','); },
						toAttribute(arr) { return arr.join(','); }
					}
				}`
				}
			}),
			'html`<my-element complex="foo,bar"></my-element>`'
		],
		{
			rules: {
				"no-incompatible-type-binding": "off"
			}
		}
	);
	hasNoDiagnostics(t, diagnostics);
});
