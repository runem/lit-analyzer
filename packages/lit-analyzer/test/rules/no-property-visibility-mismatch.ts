import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";
import { tsTest } from "../helpers/ts-test";
import { TestFile } from "../helpers/compile-files";

function makeTestElement({ properties }: { properties?: Array<{ visibility: string; name: string; internal: boolean; }>; }): TestFile {
	return {
		fileName: "my-element.ts",
		text: `
		class MyElement extends HTMElement {
			${(properties || []).map(({ name, visibility, internal }) => `@${internal ? "internalProperty" : "property"}() ${visibility} ${name}`).join("\n")}
		};
		customElements.define("my-element", MyElement);	
		`
	};
}

tsTest("Report public @internalProperty properties", t => {
	const { diagnostics } = getDiagnostics(makeTestElement({
			properties: [
				{ name: 'foo', visibility: 'public', internal: true }
			]
	}), {
		rules: { "no-property-visibility-mismatch": true }
	});
	hasDiagnostic(t, diagnostics, "no-property-visibility-mismatch");
});

tsTest("Report private @property properties", t => {
	const { diagnostics } = getDiagnostics(makeTestElement({
			properties: [
				{ name: 'foo', visibility: 'private', internal: false }
			]
	}), {
		rules: { "no-property-visibility-mismatch": true }
	});
	hasDiagnostic(t, diagnostics, "no-property-visibility-mismatch");
});

tsTest("Don't report regular public properties", t => {
	const { diagnostics } = getDiagnostics(makeTestElement({
			properties: [
				{ name: 'foo', visibility: 'public', internal: false }
			]
	}), {
		rules: { "no-property-visibility-mismatch": true }
	});
	hasNoDiagnostics(t, diagnostics);
});
