// Pretending this is the Lit html function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const html: any;

/** An element to test autocomplete with. */
class CompleteMe extends HTMLElement {
	/** Docs for prop 1. */
	prop1 = "";
	/** Docs for prop 2. */
	prop2 = "";
	/** Docs for prop 3. */
	prop3 = "";
}
customElements.define("complete-me", CompleteMe);
declare global {
	interface HTMLElementTagNameMap {
		"complete-me": CompleteMe;
	}
}

// These lines are used as a basis for testing completions, with hardcoded
// line and character offsets in the test file. So if you change this file,
// you'll likely need to update those offsets in ../simple-test.ts
html`
	<complete-me
	  
	></complete-me>
	<com
`;

export {};
