import test from "ava";
import { getDiagnostics } from "../helpers/analyze";
import { hasDiagnostic, hasNoDiagnostics } from "../helpers/assert";

const preface = `
  class TrustedResourceUrl {};
  class SafeUrl {};
  class SafeStyle {};

  const trustedResourceUrl = new TrustedResourceUrl();
  const safeUrl = new SafeUrl();
  const safeStyle = new SafeStyle();
`;

test("May bind string to script src with default config", t => {
	const { diagnostics } = getDiagnostics('html`<script .src=${"/foo.js"}></script>`', {});
	hasNoDiagnostics(t, diagnostics);
});

test("May not bind string to script src with ClosureSafeTypes config", t => {
	const { diagnostics } = getDiagnostics('html`<script src=${"/foo.js"}></script>`', { securitySystem: "ClosureSafeTypes" });
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

test("May not bind string to script .src with ClosureSafeTypes config", t => {
	const { diagnostics } = getDiagnostics('html`<script .src=${"/foo.js"}></script>`', { securitySystem: "ClosureSafeTypes" });
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

test("May pass static string to script src with ClosureSafeTypes config", t => {
	const { diagnostics } = getDiagnostics('html`<script src="/foo.js"></script>`', { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});

let testName = "May not pass a TrustedResourceUrl to script src with default config";
test(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<script src=${trustedResourceUrl}></script>`");
	hasDiagnostic(t, diagnostics, "no-complex-attribute-binding");
});

// Commented out because we're missing properties on built in elements like
// script.
testName = "May not pass a TrustedResourceUrl to script .src with default config";
test.skip(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<script .src=${trustedResourceUrl}></script>`");
	hasDiagnostic(t, diagnostics, "no-complex-attribute-binding");
});

testName = "May pass a TrustedResourceUrl to script src with ClosureSafeTypes config";
test(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<script src=${trustedResourceUrl}></script>`", { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});

testName = "May pass a TrustedResourceUrl to script .src with ClosureSafeTypes config";
test(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<script .src=${trustedResourceUrl}></script>`", { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});

testName = "May not pass a SafeUrl to script src with ClosureSafeTypes config";
test(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<script src=${safeUrl}></script>`", { securitySystem: "ClosureSafeTypes" });
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

testName = "May not pass a SafeUrl to script .src with ClosureSafeTypes config";
test(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<script .src=${safeUrl}></script>`", { securitySystem: "ClosureSafeTypes" });
	hasDiagnostic(t, diagnostics, "no-incompatible-type-binding");
});

testName = "May pass either a SafeUrl or a TrustedResourceUrl or a string to img src with ClosureSafeTypes config";
test(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<img src=${safeUrl}></script>`", { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);

	const { diagnostics: moreDiagnostics } = getDiagnostics(preface + "html`<img src=${trustedResourceUrl}></script>`", {
		securitySystem: "ClosureSafeTypes"
	});
	hasNoDiagnostics(t, moreDiagnostics);

	const { diagnostics: evenMoreDiagnostics } = getDiagnostics(preface + "html`<img src=${'/img.webp'}></script>`", {
		securitySystem: "ClosureSafeTypes"
	});
	hasNoDiagnostics(t, evenMoreDiagnostics);
});

testName = "May pass either a SafeUrl or a TrustedResourceUrl or a string to img .src with ClosureSafeTypes config";
test(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<img .src=${safeUrl}></script>`", { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);

	const { diagnostics: moreDiagnostics } = getDiagnostics(preface + "html`<img .src=${trustedResourceUrl}></script>`", {
		securitySystem: "ClosureSafeTypes"
	});
	hasNoDiagnostics(t, moreDiagnostics);

	const { diagnostics: evenMoreDiagnostics } = getDiagnostics(preface + "html`<img .src=${'/img.webp'}></script>`", {
		securitySystem: "ClosureSafeTypes"
	});
	hasNoDiagnostics(t, evenMoreDiagnostics);
});

testName = "May pass a string to style with ClosureSafeTypes config";
test(testName, t => {
	const { diagnostics } = getDiagnostics(preface + 'html`<div style=${"color: red"}></div>`', { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});

testName = "May pass a string to .style with ClosureSafeTypes config";
test(testName, t => {
	const { diagnostics } = getDiagnostics(preface + 'html`<div .style=${"color: red"}></div>`', { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});

testName = "May pass a SafeStyle to style with ClosureSafeTypes config";
test(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<div style=${safeStyle}></div>`", { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});

testName = "May pass a SafeStyle to .style with ClosureSafeTypes config";
test(testName, t => {
	const { diagnostics } = getDiagnostics(preface + "html`<div .style=${safeStyle}></div>`", { securitySystem: "ClosureSafeTypes" });
	hasNoDiagnostics(t, diagnostics);
});
