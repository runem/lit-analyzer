# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

<!--
   PRs should document their user-visible changes (if any) in the
   Unreleased section, uncommenting the header as necessary.
-->
<!-- ### Added -->
<!-- ### Changed -->
<!-- ### Removed -->
<!-- ### Fixed -->

## [1.0.0] - 2019-04-01

### Added

-   Added support for `observedAttributes`, `properties` and `jsdoc comments` as well as web component libraries built with stencil.
-   Autocompletion and type checking for properties. Properties on built in elements are supported.
-   Autocompletion and name checking for **slots**. Add slots to your component using `@slot myslot` jsdoc.
-   Autocompletion and name checking for **events**. `new CustomEvent("myevent")` in the component is found automatically or you can choose to add events to your component using `@event myevent` jsdoc.
-   Added check for using the property modifier without an expression as this is not support by lit-html to catch errors like `.myProp="hello"`.
-   Added support for code folding
-   Added support for vscode custom html data format.
-   Support for declaring attributes and properties using `@attr myattr` and `@prop myprop` jsdoc.
-   CSS autocompletion now includes all custom element tag names available.

### Fixed

-   The web component analyzer is now much more stable and won't crash on strange inputs.

### Removed

-   Temporarily disabled code formatting until issues with nested templates are solved.

## [0.1.0] - 2019-02-22

### Added

-   Added code completions and diagnostics for the `CSS` tagged template and`<style>` tag.
-   Added check for non-callable types given to event listeners in order to catch errors like `@click="myHandler()"`.
-   More reliable type checking across all assignments.
-   Better support for built in tag names and global attributes. These now directly use data from the vscode html language service.
-   Values are now auto completed for attribute assignments where possible. For example an attribute with a string union type `"large" | "small"` will suggest these values.
-   Inline documentation is now shown when listing completions.

### Fixed

-   Fixed issue where components from libraries would be imported as `import "../../node_modules/my-component"` and not `import "my-component"`
-   Added various missing global built in elements.
-   Added various missing global built in attributes like 'aria-\*' attributes.

## [0.0.24] - 2019-02-08

### Added

-   Added support for `@ts-ignore` comments ([#2](https://github.com/runem/ts-lit-plugin/pull/2))
-   Added reformat support
-   Added support for libraries that extend the global `HTMLElementTagNameMap`

### Fixed

-   Fixed broken auto-close tag functionality
