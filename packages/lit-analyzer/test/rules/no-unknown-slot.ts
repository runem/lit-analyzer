import test from "ava";
import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { makeElement } from "../helpers/generate-test-file";

test("Report unknown slot name", t => {
	const { diagnostics } = getDiagnostics([makeElement({ slots: ["foo"] }), "html`<my-element><div slot='bar'></div></my-element>`"], {
		rules: { "no-unknown-slot": true }
	});
	hasDiagnostic(t, diagnostics, "no-unknown-slot");
});

test("Don't report known slot name", t => {
	const { diagnostics } = getDiagnostics([makeElement({ slots: ["foo"] }), "html`<my-element><div slot='foo'></div></my-element>`"], {
		rules: { "no-unknown-slot": true }
	});
	hasNoDiagnostics(t, diagnostics);
});

test("Don't report known, unnamed slot name", t => {
	const { diagnostics } = getDiagnostics([makeElement({ slots: [""] }), "html`<my-element><div slot=''></div></my-element>`"], {
		rules: { "no-unknown-slot": true }
	});
	hasNoDiagnostics(t, diagnostics);
});

test("Report missing slot attribute", t => {
	const { diagnostics } = getDiagnostics([makeElement({ slots: ["foo"] }), "html`<my-element><div></div></my-element>`"], {
		rules: { "no-unknown-slot": true }
	});
	hasDiagnostic(t, diagnostics, "no-unknown-slot");
});
