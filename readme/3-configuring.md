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
 
### cssTemplateTags
 
-   **Type**: string[]
-   **Default**: ["css"]
-   **Description**: List of template tags to enable css support in.
 
### globalHtmlTags
 
-   **Type**: string[]
-   **Default**: []
-   **Description**: List of html tag names that you expect to be present at all times.
 
### globalHtmlAttributes
 
-   **Type**: string[]
-   **Default**: []
-   **Description**: List of html attributes names that you expect to be present at all times. These attributes are not checked at all.
 
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