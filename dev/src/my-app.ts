import { html, render } from "lit-html";
import "./my-element";
import "@material/mwc-button/mwc-button";
import "./my-button";
import "@ideanote/atoms/lib/card";
import { MyButton } from "./my-button";

(async () => {
	await import("./my-card");
})();

MyButton;

const myApp = (text: string, disabled: boolean) => html`
	<style>
		my-button {
			color: ${"green"};
		}
	</style>

	<lkjsldkfj></lkjsldkfj>

	<a target="_blank" download></a>

	<mwc-button></mwc-button>

	<sldkfjlskjdf></sldkfjlskjdf>

	<my-tsconfig-element></my-tsconfig-element>
	<at-card @change="${() => {}}" globalattribute>
		<slot></slot>
	</at-card>

	<at-card></at-card>

	<video playsinline muted preload="metadata" aria-pressed="undefined" aria-readonly="true"></video>

	<my-test>
		<div slot="myslot"></div>
	</my-test>

	<mwc-button dense></mwc-button>

	<div role="heading" .scrollTop="${123}">
		<my-button this-is-an-attr size="${"small"}" text="123"></my-button>
	</div>

	<my-card></my-card>
	<my-element></my-element>

	<mwc-button></mwc-button>

	<my-external-tag draggable="true"></my-external-tag>

	<mwc-button label="" dense role="math" aria-checked="true" .accessKey="${"hejsa"}" onsubmit="" .dlfkjsdlfkjsdlfkj="${"test"}" @my-event=""></mwc-button>

	<div @change="${() => {}}" @hello="${console.log}" @test-event="${() => {}}" @loadstart="${() => {}}" @hello="${() => {}}">
		<my-element data-looolz="" onmy-event="" a b c .minSetter="${""}" .prop1="${"hello"}" my-attr-hehehe="" @change="${() => {}}" @test-event="${() => true}">
			<div slot=""></div>
			<div slot="hello"></div>
		</my-element>
	</div>

	<input .value="${null}" .disabled="${true}" type="email" maxlength="1" tabindex="${1 === 1 ? "-1" : "0"}" />
`;

render(myApp("Hello", false), document.body);
