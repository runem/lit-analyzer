import { html, render } from "lit-html";
import "./my-button";

const myApp = (text: string, disabled: boolean) => html`
	<my-button size="large" text="${text}" ?disabled="${disabled}"></my-button>
`;

render(myApp("Hello", false), document.body);
