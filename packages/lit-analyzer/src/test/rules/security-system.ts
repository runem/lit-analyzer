import { getDiagnostics } from "../helpers/analyze.js";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert.js";
import { tsTest } from "../helpers/ts-test.js";

const preface = `
  class TrustedResourceUrl {};
  class SafeUrl {};
  class SafeStyle {};

  const trustedResourceUrl = new TrustedResourceUrl();
  const safeUrl = new SafeUrl();
  const safeStyle = new SafeStyle();

	const anyValue: any = {};
`;

tsTest("May bind string to script src with default config", t => {
	const { diagnostics } = getDiagnostics('html`<script .src=${"/foo.js"}></script>`', {});
	hasNoDiagnostics(t, diagnostics);
});

tsTest("May not bind string to script src with ClosureSafeTypes config", t => {
	const { diagnostics } = getDiagnostics('html`<script src=${"/foo.js"}></script>`', { securitySystem: "ClosureSafeTypes" });
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("May not bind string to script .src with ClosureSafeTypes config", t => {
	const { diagnostics } = getDiagnostics('html`<script .src=${"/foo.js"}></script>`', { securitySystem: "ClosureSafeTypes" });
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

tsTest("May pass static string to script src with ClosureSafeTypes config", t => {
	const { diagnostics } = getDiagnostics('html`<script src="/foo.js"></script>`', { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});

let testName = "May not pass a TrustedResourceUrl to script src with default config";
tsTest(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<script src=${trustedResourceUrl}></script>`");
	hasDiagnostic(t, diagnostics, "no-complex-attribute-binding");
});

testName = "May not pass a TrustedResourceUrl to script .src with default config";
tsTest(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<script .src=${trustedResourceUrl}></script>`");
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

testName = "May pass a TrustedResourceUrl to script src with ClosureSafeTypes config";
tsTest(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<script src=${trustedResourceUrl}></script>`", { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});

testName = "May pass a TrustedResourceUrl to script .src with ClosureSafeTypes config";
tsTest(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<script .src=${trustedResourceUrl}></script>`", { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});

testName = "May not pass a SafeUrl to script src with ClosureSafeTypes config";
tsTest(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<script src=${safeUrl}></script>`", { securitySystem: "ClosureSafeTypes" });
	hasDiagnostic(t, diagnostics, "no-complex-attribute-binding");
});

testName = "May not pass a SafeUrl to script .src with ClosureSafeTypes config";
tsTest(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<script .src=${safeUrl}></script>`", { securitySystem: "ClosureSafeTypes" });
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

testName = "May pass `any` to script src with ClosureSafeTypes config";
tsTest(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<script src=${anyValue}></script>`", { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});

testName = "May pass `any` to script .src with ClosureSafeTypes config";
tsTest(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<script .src=${anyValue}></script>`", { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});

testName = "May pass either a SafeUrl, a TrustedResourceUrl, a string, or `any` to img src with ClosureSafeTypes config";
tsTest(testName, t => {
	hasNoDiagnostics(t, getDiagnostics(preface + "html`<img src=${safeUrl}>`", { securitySystem: "ClosureSafeTypes" }).diagnostics);

	hasNoDiagnostics(
		t,
		getDiagnostics(preface + "html`<img src=${trustedResourceUrl}>`", {
			securitySystem: "ClosureSafeTypes"
		}).diagnostics
	);

	hasNoDiagnostics(
		t,
		getDiagnostics(preface + "html`<img src=${'/img.webp'}>`", {
			securitySystem: "ClosureSafeTypes"
		}).diagnostics
	);

	hasNoDiagnostics(
		t,
		getDiagnostics(preface + "html`<img src=${anyValue}>`", {
			securitySystem: "ClosureSafeTypes"
		}).diagnostics
	);
});

testName = "May pass either a SafeUrl, a TrustedResourceUrl, a string, or `any` to img .src with ClosureSafeTypes config";
tsTest(testName, t => {
	hasNoDiagnostics(t, getDiagnostics(preface + "html`<img .src=${safeUrl}>`", { securitySystem: "ClosureSafeTypes" }).diagnostics);

	hasNoDiagnostics(
		t,
		getDiagnostics(preface + "html`<img .src=${trustedResourceUrl}>`", {
			securitySystem: "ClosureSafeTypes"
		}).diagnostics
	);

	hasNoDiagnostics(
		t,
		getDiagnostics(preface + "html`<img .src=${'/img.webp'}>`", {
			securitySystem: "ClosureSafeTypes"
		}).diagnostics
	);

	hasNoDiagnostics(
		t,
		getDiagnostics(preface + "html`<img .src=${anyValue}>`", {
			securitySystem: "ClosureSafeTypes"
		}).diagnostics
	);
});

testName = "May pass a string to style with ClosureSafeTypes config";
tsTest(testName, t => {
	const { diagnostics } = getDiagnostics(preface + 'html`<div style=${"color: red"}></div>`', { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});

testName = "May pass a string to .style with ClosureSafeTypes config";
tsTest(testName, t => {
	const { diagnostics } = getDiagnostics(preface + 'html`<div .style=${"color: red"}></div>`', { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});

testName = "May pass a SafeStyle to style with ClosureSafeTypes config";
tsTest(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<div style=${safeStyle}></div>`", { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});

testName = "May pass a SafeStyle to .style with ClosureSafeTypes config";
tsTest(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<div .style=${safeStyle}></div>`", { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});

testName = "May pass a `any` to style with ClosureSafeTypes config";
tsTest(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<div style=${anyValue}></div>`", { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});

testName = "May pass a `any` to .style with ClosureSafeTypes config";
tsTest(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<div .style=${anyValue}></div>`", { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});
