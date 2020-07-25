import { TestFile } from "./compile-files.js";

type PropertyDefinitions = string[] | Record<string, string>;

export function makeElement({ properties, slots }: { properties?: PropertyDefinitions; slots?: string[] }): TestFile {
	let propertiesString: string;

	if (Array.isArray(properties)) {
		propertiesString = properties.map(prop => `@property() ${prop}`).join("\n");
	} else if (properties) {
		propertiesString = Object.entries(properties)
			.map(([prop, config]) => {
				return `@property(${config}) ${prop}`;
			})
			.join("\n");
	}

	return {
		fileName: "my-element.ts",
		text: `
		/**
${(slots || []).map(slot => `        * @slot ${slot}`)}
		 */
		class MyElement extends HTMLElement {
			${propertiesString}
		};
		customElements.define("my-element", MyElement);	
		`
	};
}
