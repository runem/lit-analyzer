## Features


### Validating html elements

#### Unknown tag name

All web components in your code are analyzed using [web-component-analyzer](https://github.com/runem/web-component-analyzer) which supports native custom elements and web components built with LitElement. Web components defined in libraries needs to either extend the global `HTMLElementTagNameMap` (typescript definition file) or include the "@customElement tag-name" jsdoc on the custom element class.

Below you will see an example of what to add to your library typescript definition files if you want type checking support for a given html tag name.

```typescript
declare global {
  interface HTMLElementTagNameMap {
    "my-element": MyElement;
  }
}
```

#### Missing imports

When using custom elements in HTML it is checked if the element has been imported and is available in the current context. It's considered imported if any imported module (or their imports) defines the custom element. You can disable this check by setting `skipMissingImports` to true in the configuration (see [Configuring the plugin](#configuring-the-plugin)).

The following examples are considered warnings:
```js
html`<my-element></my-element>`
```

The following examples are not considered warnings:
```js
import "my-element.js";
html`<my-element></my-element>`
```


#### Unclosed tag

Unclosed tags and invalid self closing tags, like custom elements tags, are checked.

The following examples are considered warnings:
```js
html`<div>`
html`<video />`
html`<custom-element />`
```

The following examples are not considered warnings:
```js
html`<div></div>`
html`<custom-element></custom-element>`
html`<video></video>`
html`<input />`
```

### Validating binding names

#### Unknown event, attribute or property

You will get a warning whenever you use an unknown attribute or property. This check is made on both custom elements and built in elements. You can opt in to check the event names as well. 

Attributes, properties and events are picked up on custom elements using [web-component-analyzer](https://github.com/runem/web-component-analyzer) which supports native custom elements and web components built with LitElement.

The following examples are considered warnings:
```js
html`<input .valuuue="${value}" tyype="button" @iinput="${console.log}" />`
```

The following examples are not considered warnings:
```js
html`<input .value="${value}" type="button" @input="${console.log}" />`
```

#### Documenting events, attributes and properties

You can document attributes, properties and events on your custom elements using the following jsdoc tags.

```js
/**
 * This is my element
 * @attr size
 * @attr {red|blue} color - The color of my element
 * @prop {String} value
 * @prop {Boolean} myProp - This is my property
 * @event change
 */
@customElement("my-element")
class MyElement extends LitElement { 

}
```

#### Custom vscode html data format
This plugin already supports [custom vscode html data format](https://code.visualstudio.com/updates/v1_31#_html-and-css-custom-data-support) (see the configuration section) and I will of course work on supporting more methods of shipping metadata alongside custom elements.


### Validating binding types

#### Boolean attribute binding on a non-boolean type

It never makes sense to use the boolean attribute binding on a non-boolean type.

The following examples are considered warnings:
```js
html`<input ?type="${"button"}" />`
```

The following examples are not considered warnings:
```js
html`<input ?disabled="${isDisabled}" />`
```

#### Property binding without an expression

Because of how `lit-html` [parses bindings internally](https://github.com/Polymer/lit-html/issues/843) you cannot use the property binding without an expression.

The following examples are considered warnings:
```js
html`<input .value="text" />`
```

The following examples are not considered warnings:
```js
html`<input .value="${text}" />`
```

#### Event handler binding with a non-callable type

It's a common mistake to incorrectly call the function when setting up an event handler binding. This makes the function call whenever the code evaluates. 

The following examples are considered warnings:
```js
html`<button @click="${myEventHandler()}">Click</button>`
html`<button @click="${{hannndleEvent: console.log()}}">Click</button>`
```

The following examples are not considered warnings:
```js
html`<button @click="${myEventHandler}">Click</button>`
html`<button @click="${{handleEvent: console.log}}">Click</button>`
```

#### Attribute binding with complex type

Binding an object using an attribute binding would result in binding the string "[object Object]" to the attribute. In this cases it's probably better to use a property binding instead.

The following examples are considered warnings:
```js
html`<my-list listitems="${listItems}"></my-list>`
```

The following examples are not considered warnings:
```js
html`<my-list .listItems="${listItems}"></my-list>`
```


#### Binding to a boolean in an attribute binding

Whenever binding to a boolean using an attribute binding, you should be using a *boolean* attribute binding instead, because it could result in binding the string "true" or "false".

This error is particular tricky, because the string "false" is truthy when evaluated in a conditional.

The following examples are considered warnings:
```js
html`<input disabled="${isDisabled}" />`
```

The following examples are not considered warnings:
```js
html`<input ?disabled="${isDisabled}" />`
```

#### Attribute binding with value that can be undefined | null 

Binding `undefined` or `null` in an attribute binding will result in binding the string "undefined" or "null". Here you should probably wrap your expression in the "ifDefined" directive.

The following examples are considered warnings:
```js
html`<input value="${maybeUndefined}" />`
html`<input value="${maybeNull}" />`
```

The following examples are not considered warnings:
```js
html`<input value="${ifDefined(maybeUndefined)}" />`
html`<input value="${ifDefined(maybeNull === null ? undefined : maybeNull)}" />`
```

#### Binding an incompatible type

Assignments in your HTML are typed checked just like it would be in Typescript.

The following examples are considered warnings:
```js
html`<input type="wrongvalue" />`
html`<input placeholder />`
html`<input max="${"hello"}" />`
html`<my-list .listItems="${123}"></my-list>`
```

The following examples are not considered warnings:
```js
html`<input type="button" />`
html`<input placeholder="a placeholder" />`
html`<input max="${123}" />`
html`<my-list .listItems="${listItems}"></my-list>`
```

#### Invalid slot name

Using the "@slot" jsdoc tag on your custom element class, you can tell which slots are accepted for a particular element. Then you will get warnings for invalid slot names and if you forget to add the slot attribute on elements without an unnamed slot.

```js
/**
 * @slot - This is a comment for the unnamed slot
 * @slot right - Right content
 * @slot left
 */
class MyElement extends HTMLElement {
}
customElements.define("my-element", MyElement);
```

The following examples are considered warnings:
```js
html`
<my-element>
  <div slot="not a slot name"></div>
</my-element>
`
```

The following examples are not considered warnings:
```js
html`
<my-element>
  <div></div>
  <div slot="right"></div>
  <div slot="left"></div>
</my-element>
`
```

#### Invalid usage of directives

Directives are checked to make sure that the following rules are met.
* `ifDefined` is only used in an attribute binding.
* `class` is only used in an attribute binding on the 'class' attribute.
* `style` is only used in an attribute binding on the 'style' attribute.
* `unsafeHTML`, `cache`, `repeat`, `asyncReplace` and `asyncAppend` are only used within a text binding.

The following examples are considered warnings:
```js
html`<button value="${unsafeHTML(html)}"></button>`
html`<input .value="${ifDefined(myValue)}" />`
html`<div role="${class(classMap)}"></div>`
```

The following examples are not considered warnings:
```js
html`<button>${unsafeHTML(html)}</button>`
html`<input .value="${myValue}" />`
html`<input value="${myValue}" />`
html`<div class="${class(classMap)}"></div>`
```



### Validating LitElement

#### Incompatible LitElement property type

When using the @property decorator in Typescript, the property option `type` is checked against the declared property Typescript type.

The following examples are considered warnings:
```js
class MyElement extends LitElement {
  @property({type: Number}) text: string;
  @property({type: Boolean}) count: number;
  @property({type: String}) disabled: boolean;
  @property({type: Object}) list: ListItem[];
}
```

The following examples are not considered warnings:
```js
class MyElement extends LitElement {
  @property({type: String}) text: string;
  @property({type: Number}) count: number;
  @property({type: Boolean}) disabled: boolean;
  @property({type: Array}) list: ListItem[];
}
```

#### Unknown LitElement property type

The default converter in LitElement only accepts `String`, `Boolean`, `Number`, `Array` and `Object`, so all other values for `type` are considered warnings. This check doesn't run if a custom converter is used.

The following examples are considered warnings:
```js
class MyElement extends LitElement {
  static get properties () {
    return {
      callback: {
        type: Function
      },
      text: {
        type: MyElement
      }
    }
  }
}
```

The following examples are not considered warnings:
```js
class MyElement extends LitElement {
  static get properties () {
    return {
      callback: {
        type: Function,
        converter: myCustomConverter
      },
      text: {
        type: String
      }
    }
  }
}
```


#### Invalid attribute name

When using the property option `attribute`, the value is checked to make sure it's a valid attribute name.

The following examples are considered warnings:
```js
class MyElement extends LitElement {
  static get properties () {
    return {
      text: {
        attribute: "invald=name"
      }
    }
  }
}
```

#### Invalid custom element tag name

When defining a custom element, the tag name is checked to make sure it's a valid custom element name.

The following examples are considered warnings:
```js
@customElement("wrongElementName")
class MyElement extends LitElement {
}

customElements.define("alsoWrongName", MyElement);
```

The following examples are not considered warnings:
```js
@customElement("my-element")
class MyElement extends LitElement {
}

customElements.define("correct-element-name", MyElement);
```

### Validating CSS

`lit-analyzer` uses [vscode-html-languageservice](https://github.com/Microsoft/vscode-html-languageservice) to validate CSS.
