import test from "ava";
import { getDiagnostics } from "../helpers/analyze";

test.skip("Emits 'no-invalid-boolean-binding' diagnostic when a boolean binding is used on a non-boolean type", t => {
	const { diagnostics } = getDiagnostics('html`<input ?type="button" />`');
	t.is(diagnostics.length, 1);

	const [diagnostic] = diagnostics;
	t.is(diagnostic.source, "no-invalid-boolean-binding");
});

test.skip("Emits no 'no-invalid-boolean-binding' diagnostic when the rule is turned off", t => {
	const { diagnostics } = getDiagnostics('html`<input ?type="button" />`', { rules: { "no-invalid-boolean-binding": "off" } });
	t.is(diagnostics.length, 0);
});

test.skip("Emits no 'no-invalid-boolean-binding' diagnostic when a boolean binding is used on a boolean type", t => {
	const { diagnostics } = getDiagnostics('html`<input ?disabled="${true}" />`');
	t.is(diagnostics.length, 0);
});
