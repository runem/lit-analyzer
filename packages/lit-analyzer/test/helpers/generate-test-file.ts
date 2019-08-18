import { TestFile } from "./analyze";

export function makeElement({ properties }: { properties?: string[] }): TestFile {
	return {
		text: `
		class MyElement extends HTMElement {
			${(properties || []).map(prop => `@property() ${prop}`).join("\n")}
		};
		customElements.define("my-element", MyElement);	
		`
	};
}
