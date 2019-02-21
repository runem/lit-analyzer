import { html, render } from "lit-html";
import { ifDefined } from "lit-html/directives/if-defined";
import "./my-button";

const myApp = (text: string, disabled: boolean) => html`
	<style>
		my-button {
			color: ${"green"};
		}
	</style>

	<div>
		<my-button disabled size="large" text="Hello"></my-button>
	</div>
`;

render(myApp("Hello", false), document.body);
