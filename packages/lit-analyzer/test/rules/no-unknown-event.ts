import test from "ava";
import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";

test("Don't report unknown events when 'no-unknown-event' is turned off", t => {
	const { diagnostics } = getDiagnostics("html`<input @foo='${console.log}' />`", { rules: { "no-unknown-event": false } });
	hasNoDiagnostics(t, diagnostics);
});

test("Report unknown events on known element", t => {
	const { diagnostics } = getDiagnostics("html`<input @foo='${console.log}' />`", { rules: { "no-unknown-event": true } });
	hasDiagnostic(t, diagnostics, "no-unknown-event");
});

test("Don't report known events", t => {
	const { diagnostics } = getDiagnostics("html`<input @click='${console.log}' />`", { rules: { "no-unknown-event": true } });
	hasNoDiagnostics(t, diagnostics);
});

test("Don't report unknown events on unknown element", t => {
	const { diagnostics } = getDiagnostics("html`<unknown-element @foo='${console.log}'></unknown-element>`", {
		rules: { "no-unknown-event": true, "no-unknown-tag-name": false }
	});
	hasNoDiagnostics(t, diagnostics);
});
