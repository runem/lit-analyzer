import { html, render } from "lit-html";
import "./my-button";

const myApp = (text: string, disabled: boolean) => html`
	<style>
		my-button {
			color: ${"green"};
		}
	</style>

	<div role="heading">
		<my-button disabled size="large" text="Hello"></my-button>
	</div>

	<input type="email" maxlength="123" />
`;

render(myApp("Hello", false), document.body);
