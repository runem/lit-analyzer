# Change Log

All notable changes to this project will be documented in this file.

<!-- ### Added -->
<!-- ### Changed -->
<!-- ### Removed -->
<!-- ### Fixed -->

## [1.3.0] - 14/6/2023

- Support TypeScript 5.0
- Drop support for TypeScript versions <4.4.4

## [1.2.4] - 19/4/2022

- Fixed a bug where the TS plugin would interfere with automatic import
  insertion.
- Improved compatibility with recent and future versions of TypeScript.
- Updated deps

## [1.2.1] - 25/7/2020

### Fixed

- Markdown output is no properly escaped ([#119](https://github.com/runem/lit-analyzer/issues/119))
- Code fixes now works again in Webstorm (rule ids now start at 2300) ([#124](https://github.com/runem/lit-analyzer/issues/124))
- Fixed CSS auto completion ([#120](https://github.com/runem/lit-analyzer/issues/120))

## [1.2.0] - 15/7/2020

### Added

- Added new rule `no-property-visibility-mismatch`. This rule will ensure public properties use `@property` and non-public properties use `@internalProperty` ([#100](https://github.com/runem/lit-analyzer/pull/100))
- Added new rule `no-missing-element-type-definition` This rule will ensure that custom elements are registered on the
  `HTMLElementTagNameMap` Typescript interface ([#73](https://github.com/runem/lit-analyzer/issues/73))
- It's now possible to configure how many modules deep dependencies are followed to determine whether a custom element is available in the current file. When `-1` is used, dependencies will be followed infinitely deep. This can be configured for both external dependencies and project dependencies with `maxNodeModuleImportDepth` & `maxProjectImportDepth` ([#116](https://github.com/runem/lit-analyzer/pull/116))
- In addition to extending `HTMLElementTagNameMap` it's now also possible extend the `HTMLElementEventMap` interface and the `HTMLElement` interface ([#53](https://github.com/runem/lit-analyzer/issues/53))

**Example:**

```
declare global {
  interface HTMLElementTagNameMap {
    "my-element": HTMLElement;
  }
  interface HTMLElementEventMap {
    "my-event": Event;
  }
}

/**
 * @attr my-attr
 */
interface HTMLElement {
  myProperty: string;
}
```

- Added autocompletion for CSS shadow parts and CSS custom properties in CSS. It's possible to document those using JSDoc ([dd1ffc78](https://github.com/runem/lit-analyzer/pull/112/commits/dd1ffc78d4fb6ccbe49b7cf91c11ba02d8b0dfa5))
- The [role](https://www.w3.org/TR/role-attribute/) and [controlslist](https://wicg.github.io/controls-list/html-output/multipage/embedded-content.html#attr-media-controlslist) attributes are now correctly type checked ([#89](https://github.com/runem/lit-analyzer/issues/89))

**Example:**

```
/**
 * @cssprop {Color} --border-color - Sets the color of the border
 * @csspart content - The content of my element
 */
class MyElement extends HTMLElement {
}
```

### Fixed and changed

- Quick fix for missing imports now generates correct path on Windows ([#110](https://github.com/runem/lit-analyzer/pull/110))
- **Type checking is now up to 15 times faster**
- `is-assignable-in-boolean-binding` now also accepts "null" and "undefined" types in boolean bindings. Example: `<input ?required="${undefined}" />`
- "Fix message" is now included in the output for the CLI -`no-unknown-property-converter` has been removed and `no-incompatible-property-type` can be used instead.
- Improved JSDoc support
- Improved mixin support
- Private and protected members are now also analyzed
- All diagnostics in vscode are now reported as `lit-plugin([RULE_ID])` and have unique diagnostic codes ([#108](https://github.com/runem/lit-analyzer/issues/108))
- When resolving imports for a given module, facade modules are always followed and do not increase depth ([#114](https://github.com/runem/lit-analyzer/pull/114))
- Improve codefix for 'no-missing-import' rule ([#117](https://github.com/runem/lit-analyzer/pull/117))

### Project

- Refactoring of rule modules
- Added more tests
- `lit-analyzer` now uses data from `vscode-web-custom-data`
- `cancellationToken` is now supported to prevent long running operations

## [1.1.11] - 21/5/2020

### Added

- New rule: `no-legacy-attribute` which is disabled as default. A common mistake when dealing with Lit in particular is to use the legacy Polymer syntax as seen in earlier versions of Polymer (the predecessor of Lit). This rule catches this mistake (see [#95](https://github.com/runem/lit-analyzer/pull/95))
- Added closure security safe type for `<source src>` (see [#88](https://github.com/runem/lit-analyzer/pull/88))
- Fixed typo about event type detection (see [#86](https://github.com/runem/lit-analyzer/pull/86))

### Fixed

- Better performance when using the `no-missing-imports` rule. `lit-analyzer` will still check imported modules in your project as usual, however, it will only follow imports 2 levels deep into any imported module from an external dependency (see [#93](https://github.com/runem/lit-analyzer/pull/93))
- The CLI-option `maxWarnings` defaults to `-1` to avoid failing when the analysis found only warnings (see [#96](https://github.com/runem/lit-analyzer/pull/96))

## [1.1.10] - 2/3/2020

### Added

- Added basic support for type checking code with Safe Types sanitization in place ([#62](https://github.com/runem/lit-analyzer/pull/62))
- VSCode parameter hints for html/css tagged template literal are now hidden ([#61](https://github.com/runem/lit-analyzer/issues/61))

### Fixed

- Fixed css list substitution bug ([#76](https://github.com/runem/lit-analyzer/pull/76))
- Fixed problem where when input type is date, min and max should accept date string ([#77](https://github.com/runem/lit-analyzer/issues/77))
- Fixed `no-boolean-in-attribute-binding` to allow assigning booleans that are coerced to string to 'true'|'false' where appropriate ([#dc6cdc6db](https://github.com/runem/lit-analyzer/commit/dc6cdc6dbf5388e55d2d0b93fce21074deceeaad))

## [1.1.9] - 17/10/2019

### Added

- New rule `no-unintended-mixed-binding` to prevent bugs like `<input value=${"foo"}} />` ([#44](https://github.com/runem/lit-analyzer/issues/44))
- Hex colors within html/css templates are now highlighted in the vscode plugin ([#30](https://github.com/runem/lit-analyzer/issues/30))

### Fixed

- Big internal refactor, including adding a lot of tests ([#49](https://github.com/runem/lit-analyzer/pull/49))
- Fixed problem where closing tags weren't auto-completed properly ([#37cba351](https://github.com/runem/lit-analyzer/commit/37cba3519762a1b8c6f6522baa40842e1b5ac504))
- Fixed problem where lit-analyzer would crash when running with a newer version of Typescript ([#58](https://github.com/runem/lit-analyzer/issues/58))

## [1.1.8] - 13/8/2019

### Added

- Export Bazel plugin ([#39](https://github.com/runem/lit-analyzer/issues/39))
- Support css snippets and % units ([#40](https://github.com/runem/lit-analyzer/issues/40))

### Fixed

- Fix problem where the value of attributes on the form attr='val' could get parsed incorrectly. ([#36](https://github.com/runem/lit-analyzer/issues/36))

## [1.1.4] - 5/8/2019

### Added

- Some rules are disabled as default to give users a smoother on-boarding experience. To re-enable the stricter rules please set "strict: true". Consult the documentation for more information.
- Functionality has been refactored into "rules" which can be enabled and disabled individually. It should now be much clearer how to enabled or disable individual functionality. Consult the documentation for more information.

- When using the @property decorator from "lit-element" the type of "{type: ...}" is checked against the actual property type.
- Support for using components built with mixins
- Warning when using boolean type expression in attribute binding ([#15](https://github.com/runem/lit-analyzer/issues/15))
- Allow "null" and "undefined" as values always when using "?" attr binding ([#16](https://github.com/runem/lit-analyzer/issues/16))
- Suggested code fix: Please use the `ifDefined` directive. ([#17](https://github.com/runem/lit-analyzer/issues/17))
- The usage of built-in directives is now checked to make sure that they are used correctly.
- Experimental: It's now possible to refactor custom element tag names.

- The analyzer has been updated and should now be much more robust (see [web-component-analyzer](https://github.com/runem/web-component-analyzer)).
- The type checker has been updated and should now be much more robust (see [ts-simple-type](https://github.com/runem/ts-simple-type)).

## [1.0.0] - 1/4/2019

### Added

- Added support for `observedAttributes`, `properties` and `jsdoc comments` as well as web component libraries built with stencil.
- Autocompletion and type checking for properties. Properties on built in elements are supported.
- Autocompletion and name checking for **slots**. Add slots to your component using `@slot myslot` jsdoc.
- Autocompletion and name checking for **events**. `new CustomEvent("myevent")` in the component is found automatically or you can choose to add events to your component using `@fires myevent` jsdoc.
- Added check for using the property modifier without an expression as this is not support by lit-html to catch errors like `.myProp="hello"`.
- Added support for code folding
- Added support for vscode custom html data format.
- Support for declaring attributes and properties using `@attr myattr` and `@prop myprop` jsdoc.
- CSS autocompletion now includes all custom element tag names available.

### Fixed

- The web component analyzer is now much more stable and won't crash on strange inputs.

### Removed

- Temporarily disabled code formatting until issues with nested templates are solved.

## [0.1.0] - 22/2/2019

### Added

- Added code completions and diagnostics for the `CSS` tagged template and`<style>` tag.
- Added check for non-callable types given to event listeners in order to catch errors like `@click="myHandler()"`.
- More reliable type checking across all assignments.
- Better support for built in tag names and global attributes. These now directly use data from the vscode html language service.
- Values are now auto completed for attribute assignments where possible. For example an attribute with a string union type `"large" | "small"` will suggest these values.
- Inline documentation is now shown when listing completions.

### Fixed

- Fixed issue where components from libraries would be imported as `import "../../node_modules/my-component"` and not `import "my-component"`
- Added various missing global built in elements.
- Added various missing global built in attributes like 'aria-\*' attributes.

## [0.0.24] - 8/2/2019

### Added

- Added support for `@ts-ignore` comments ([#2](https://github.com/runem/lit-analyzer/pull/2))
- Added reformat support
- Added support for libraries that extend the global `HTMLElementTagNameMap`

### Fixed

- Fixed broken auto-close tag functionality
