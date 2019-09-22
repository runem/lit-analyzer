import test from "ava";
import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { makeElement } from "../helpers/generate-test-file";

test("Don't report unknown properties when 'no-unknown-property' is turned off", t => {
	const { diagnostics } = getDiagnostics("html`<input .foo='${''}' />`", { rules: { "no-unknown-property": false } });
	hasNoDiagnostics(t, diagnostics);
});

test("Report unknown properties on known element", t => {
	const { diagnostics } = getDiagnostics("html`<input .foo='${''}' />`", { rules: { "no-unknown-property": true } });
	hasDiagnostic(t, diagnostics, "no-unknown-property");
});

test("Don't report known properties", t => {
	const { diagnostics } = getDiagnostics([makeElement({ properties: ["foo: string"] }), "html`<my-element .foo='${''}'></my-element>`"], {
		rules: { "no-unknown-property": true }
	});
	hasNoDiagnostics(t, diagnostics);
});

test("Don't report unknown properties on unknown element", t => {
	const { diagnostics } = getDiagnostics("html`<unknown-element .foo='${''}'></unknown-element>`", {
		rules: { "no-unknown-property": true, "no-unknown-tag-name": false }
	});
	hasNoDiagnostics(t, diagnostics);
});
