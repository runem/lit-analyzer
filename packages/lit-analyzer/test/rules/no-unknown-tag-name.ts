import test from "ava";
import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { makeElement } from "../helpers/generate-test-file";

test("Report unknown custom elements", t => {
	const { diagnostics } = getDiagnostics("html`<unknown-element></unknown-element>`", { rules: { "no-unknown-tag-name": true } });
	hasDiagnostic(t, diagnostics, "no-unknown-tag-name");
});

test("Don't report known built in elements", t => {
	const { diagnostics } = getDiagnostics("html`<div></div>`", { rules: { "no-unknown-tag-name": true } });
	hasNoDiagnostics(t, diagnostics);
});

test("Report unknown built in elements", t => {
	const { diagnostics } = getDiagnostics("html`<element></element>`", { rules: { "no-unknown-tag-name": true } });
	hasDiagnostic(t, diagnostics, "no-unknown-tag-name");
});

test("Don't report known custom elements found in other file", t => {
	const { diagnostics } = getDiagnostics([makeElement({}), "html`<my-element></my-element>`"], { rules: { "no-unknown-tag-name": true } });
	hasNoDiagnostics(t, diagnostics);
});

test("Don't report known custom element", t => {
	const { diagnostics } = getDiagnostics(
		"class MyElement extends HTMLElement {}; customElements.define('my-element', MyElement); html`<my-element></my-element>`",
		{ rules: { "no-unknown-tag-name": true } }
	);
	hasNoDiagnostics(t, diagnostics);
});
