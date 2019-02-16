import { html, render } from "lit-html";
import "./my-button";

const myApp = (text: string, disabled: boolean) => html`
	<style>
		.page {
			display: none;
		}

		.page[active] {
			display: block;
		}
	</style>

	<input type="week" accept="" aria-checked="true" aria-expanded="false" />

	<my-button size="medium"></my-button>
`;

render(myApp("Hello", false), document.body);
