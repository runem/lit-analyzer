<div align="center" markdown="1">

<img src="https://raw.githubusercontent.com/runem/ts-lit-plugin/master/documentation/asset/lit-plugin@256w.png" width="200">

**Typescript plugin that adds type checking and code completion for [lit-html](https://github.com/polymer/lit-html).**

<a href="https://npmcharts.com/compare/ts-lit-plugin?minimal=true"><img alt="Downloads per month" src="https://img.shields.io/npm/dm/ts-lit-plugin.svg" height="20"></img></a>
<a href="https://david-dm.org/runem/ts-lit-plugin"><img alt="Dependencies" src="https://img.shields.io/david/runem/ts-lit-plugin.svg" height="20"></img></a>
<a href="https://www.npmjs.com/package/ts-lit-plugin"><img alt="NPM Version" src="https://badge.fury.io/js/ts-lit-plugin.svg" height="20"></img></a>
<a href="https://github.com/runem/ts-lit-plugin/graphs/contributors"><img alt="Contributors" src="https://img.shields.io/github/contributors/runem/ts-lit-plugin.svg" height="20"></img></a>
<a href="https://opensource.org/licenses/MIT"><img alt="MIT License" src="https://img.shields.io/badge/License-MIT-yellow.svg" height="20"></img></a>
[![](https://vsmarketplacebadge.apphb.com/version/runem.lit-plugin.svg)](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin)

![](documentation/asset/lit-plugin.gif)

</div>

## Overview

-   [Attribute type checking](#attribute-type-checking)
-   [Automatically pick up on lit-element custom elements](#automatically-pick-up-on-lit-element-custom-elements)
-   [Support for dependencies that extend the global HTMLElementTagNameMap](#support-for-dependencies-that-extend-the-global-HTMLElementTagNameMap)
-   [Report missing imports of custom elements](#report-missing-imports-of-custom-elements)
-   [Goto definition for html tags and attributes](#goto-definition-for-html-tags-and-attributes)
-   [Code completions for html tags and attributes](#code-completions-for-html-tags-and-attributes)
-   [Quick info on hover for html tags and attributes](#quick-info-on-hover-for-html-tags-and-attributes)
-   [Warning if required attributes not included](#warning-if-required-attributes-not-included)
-   [Support for @ts-ignore comments inside html](#support-for-@ts-ignore-comments-inside-html)
-   [Reformat html](#reformat-html)
-   [Auto close tags](#auto-close-tags)

See [Features](#features) for a description of each feature.

## Install

### Visual Studio Code

If you use Visual Studio Code you can simply install the [lit-plugin](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin) extension.

```bash
code --install-extension runem.lit-plugin
```

### Other

First, install the plugin:

```bash
npm install ts-lit-plugin -D
```

Then add a `plugins` section to your [`tsconfig.json`](http://www.typescriptlang.org/docs/handbook/tsconfig-json.html):

<!-- prettier-ignore -->
```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "ts-lit-plugin"
      }
    ]
  }
}
```

See [Configuring the plugin](#configuring-the-plugin) for more information regarding how to configure the plugin.

## Features

### Attribute type checking

`lit-plugin` type checks all attributes assignment, both on your own elements, library elements and built in elements. You will also get the following warnings:

-   Warning if you assign a complex type without using the `.` modifier.
-   Warning if you use the `?` modifier on a non-boolean type.

### Automatically pick up on lit-element custom elements

If you define a `lit-element` custom element somewhere in your code `lit-plugin` will automatically pick up on it. Then it will provide auto-import functionality, type checking and code completion out of the box by looking at `@property` decorators on the element.

### Support for dependencies that extend the global HTMLElementTagNameMap

If a dependency extends the global `HTMLElementTagNameMap` this plugin will pick up on the map between the tag name and the class. Below you will see an example of what to add to your library typescript definition files if you want type checking support for a given html tag.

<!-- prettier-ignore -->
```typescript
declare global {
  interface HTMLElementTagNameMap {
    "my-element": MyElement;
  }
}
```

**Two limitations using this approach as of now**

-   By using this approach the plugin wont see detailed information about a given element as (e.g @property decorators and initializers) because it can only read public fields and their corresponding types. Therefore all properties on custom elements imported from libraries are optional and wont respect meta information in @property decorators.
-   `lit-plugin` will only be able two find your elements if you somewhere in the code imports the file. Before your import the file it will complain that the element is unknown not that it can be imported. This due to the constraint that Typescript only adds library files to the array of program files once the file has been imported.

I'm working on integrating support for the proposed [web-components.json](https://github.com/w3c/webcomponents/issues/776) file.

### Report missing imports of custom elements

When using custom elements `lit-plugin` checks if the element has been imported and is available in the current context. It's considered imported if any file in the path of imports defines the custom element. You can disable this check by setting `skipMissingImports` to true in the configuration (see [Configuring the plugin](#configuring-the-plugin)). Be aware that dependencies need to extend the global `HTMLElementTagNameMap` in order for this plugin to pick up on them.

### Goto definition for html tags and attributes

`Cmd+Click (Mac)` / `Ctrl+Click (Windows)` on a tag name or an attribute name and goto the definition.

### Code completions for html tags and attributes

Press `Ctrl+Space` in an html context and to get code completions for html tags and attributes.

### Quick info on hover for html tags and attributes

Hover above a html tag or attribute and see more information about the identifier such as type and jsdoc.

### Warning if required attributes not included

`lit-plugin` will warn you if you forget to set any required attributes on a given html tag. Right now this is based on the assumption that the property is required if it doesn't have an initializer and isn't assignable to `undefined` or `null`. Be aware that right now the plugin doesn't check if you assign it else where (for example in the constructor).

**lit-plugin will think that the following is a required property**:

<!-- prettier-ignore -->
```typescript
@customElement("my-element")
export class MyElement extends LitElement {
  @property({ type: String }) text!: string;
}
```

### Support for @ts-ignore comments inside html

Add "@ts-ignore" comments to make `lit-plugin` quiet.

**In front of html template tags:**
This will make `lit-plugin` opt out of any checking inside the html template tag, but not the nested html template tags.

<!-- prettier-ignore -->
```javascript
// @ts-ignore
html`this is not checked ${html`this is checked`} `;
```

**Inside HTML:**
This will make `lit-plugin` opt out of any checking inside the div tag.

<!-- prettier-ignore -->
```javascript
return html`
  <h1>Foo</h1>

  <!-- @ts-ignore -->
  <div>
      <my-element></my-element>
  </div>
  
  <h1>Bar</h1>
`;
```

### Reformat html

`lit-plugin` will reformat html when you reformat code using your IDE. Keep in mind that right now there is an issue where the plugin does not take the current indentation of the html template tag into account. This means that the especially nested html template tags will look weird.

**For example**:

<!-- prettier-ignore -->
```javascript
return html`<div>${html`<h1>Foo</h1> <h2>Bar</h2>`}</div>`;
```

**Will become**:

<!-- prettier-ignore -->
```javascript
return html`
<div>
  ${html`<h1>Foo</h1>
<h2>Bar</h2>`}
</div>`;
```

**And not:**:

<!-- prettier-ignore -->
```javascript
return html`
  <div>
    ${html`
      <h1>Foo</h1>
      <h2>Bar</h2>
    `}
  </div>`;
```

### Auto close tags

When typing html inside a template tag `lit-plugin` auto-closes tags as you would expect.

## Configuring the plugin

If you are using the vscode plugin you can configure these options directly from extension settings. If not you can add the options directly to the `compilerOptions.plugins` section of your `ts-config.json` file.

### disable

-   **Type**: boolean
-   **Default**: false
-   **Description**: Completely disable this plugin.

### htmlTemplateTags

-   **Type**: string[]
-   **Default**: ["html", "raw"]
-   **Description**: List of template tags to enable html support in.

### externalHtmlTagNames

-   **Type**: string[]
-   **Default**: []
-   **Description**: List of html tag names that you expect to be present at all times. These tag names, including its attributes, are not checked at all.

### skipMissingImports

-   **Type**: boolean
-   **Default**: false
-   **Description**: Skip reporting missing imports of custom elements.

### skipUnknownHtmlTags

-   **Type**: boolean
-   **Default**: false
-   **Description**: Skip reporting unknown html tags.

### skipUnknownHtmlAttributes

-   **Type**: boolean
-   **Default**: false
-   **Description**: Skip reporting unknown html attributes.

### skipTypeChecking

-   **Type**: boolean
-   **Default**: false
-   **Description**: Skip type checking of attributes.

### format.disable

-   **Type**: boolean
-   **Default**: false
-   **Description**: Disable formatting the HTML on code reformat.
