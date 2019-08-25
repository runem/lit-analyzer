import { TestFile } from "./compile-files";

export function makeElement({ properties, slots }: { properties?: string[]; slots?: string[] }): TestFile {
	return {
		fileName: "my-element.ts",
		text: `
		/**
${(slots || []).map(slot => `        * @slot ${slot}`)}
		 */
		class MyElement extends HTMElement {
			${(properties || []).map(prop => `@property() ${prop}`).join("\n")}
		};
		customElements.define("my-element", MyElement);	
		`
	};
}
