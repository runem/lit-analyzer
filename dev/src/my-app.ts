import { html, render } from "lit-html";
import "./my-button";

const myApp = (text: string, myNumber: number) => html`
	<my-button class="hello" color="purple" @click="${console.log}" disabled text="${myNumber}"></my-button>
`;

render(myApp("Hello", 1), document.body);
