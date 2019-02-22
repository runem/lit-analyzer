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

## [0.1.0] - 2019-02-22

### Added

-   Added code completions and diagnostics for the `CSS` tagged template and`<style>` tag.
-   Added check for non-callable types given to event listeners in order to catch errors like `@click="myHandler()"`.
-   More reliable type checking across all assignments.
-   Better support for built in tag names and global attributes. These now directly use data from the vscode html language service.
-   Values are now auto completed for attribute assignments where possible. For example an attribute with a string union type `"large" | "small"` will suggest these values.

### Fixed

-   Fixed issue where components from libraries would be imported as `import "../../node_modules/my-component"` and not `import "my-component"`

## [0.0.24] - 2019-02-08

### Added

-   Added support for `@ts-ignore` comments ([#2](https://github.com/runem/ts-lit-plugin/pull/2))
-   Added reformat support
-   Added support for libraries that extend the global `HTMLElementTagNameMap`

### Fixed

-   Fixed broken auto-close tag functionality
