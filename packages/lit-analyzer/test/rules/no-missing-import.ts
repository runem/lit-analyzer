import test from "ava";
import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { makeElement } from "../helpers/generate-test-file";

test("Report missing imports of custom elements", t => {
	const { diagnostics } = getDiagnostics([makeElement({}), "html`<my-element></my-element>`"], { rules: { "no-missing-import": true } });
	hasDiagnostic(t, diagnostics, "no-missing-import");
});

test("Don't report missing imports when the custom element has been imported 1", t => {
	const { diagnostics } = getDiagnostics([makeElement({}), "import './my-element'; html`<my-element></my-element>`"], {
		rules: { "no-missing-import": true }
	});
	hasNoDiagnostics(t, diagnostics);
});

test("Don't report missing imports when the custom element has been imported 2", t => {
	const { diagnostics } = getDiagnostics(
		[
			makeElement({}),
			{
				fileName: "file2.ts",
				text: "import './my-element'"
			},
			"import './file2'; html`<my-element></my-element>`"
		],
		{ rules: { "no-missing-import": true } }
	);
	hasNoDiagnostics(t, diagnostics);
});
