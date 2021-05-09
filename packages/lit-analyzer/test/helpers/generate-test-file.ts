import { TestFile } from "./compile-files";

export function makeElement({ properties, slots, events }: { properties?: string[]; slots?: string[]; events?: string[] }): TestFile {
	return {
		fileName: "my-element.ts",
		text: `
		/**
${(slots || []).map(slot => `        * @slot ${slot}`)}
${(events || []).map(event => `        * @fires ${event}`)}
		 */
		class MyElement extends HTMLElement {
			${(properties || []).map(prop => `@property() ${prop}`).join("\n")}
		};
		customElements.define("my-element", MyElement);	
		`
	};
}
