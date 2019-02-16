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

	<my-button></my-button>
`;

render(myApp("Hello", false), document.body);
