import "./my-defined-element.js";

// Pretending this is the Lit html function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const html: any;

html`<my-defined-element></my-defined-element><my-other-element></my-other-element>`;
