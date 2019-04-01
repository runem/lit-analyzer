## Configuring the plugin

If you are using the vscode plugin you can configure these options directly from extension settings. If not you can add the options directly to the `compilerOptions.plugins` section of your `ts-config.json` file.

### General settings
#### disable
 
-   **Type**: boolean
-   **Default**: false
-   **Description**: Completely disable this plugin.

#### noSuggestion
 
-   **Type**: boolean
-   **Default**: false
-   **Description**: Don't attach suggestions alongside warnings and errors.
 
#### htmlTemplateTags
 
-   **Type**: string[]
-   **Default**: ["html", "raw"]
-   **Description**: List of template tags to enable html support in.
 
#### cssTemplateTags
 
-   **Type**: string[]
-   **Default**: ["css"]
-   **Description**: List of template tags to enable css support in.

#### format.disable
 
-   **Type**: boolean
-   **Default**: false
-   **Description**: Disable formatting the HTML on code reformat.

### Add checks
#### checkUnknownEvents
 
-   **Type**: boolean
-   **Default**: false
-   **Description**: Activating this setting will make the plugin emit errors on unknown events.

### Skip checks
#### skipMissingImports
 
-   **Type**: boolean
-   **Default**: false
-   **Description**: Skip reporting missing imports of custom elements.

#### skipUnknownTags
 
-   **Type**: boolean
-   **Default**: false
-   **Description**: Skip reporting unknown html tags.

#### skipUnknownAttributes
 
-   **Type**: boolean
-   **Default**: false
-   **Description**: Skip reporting unknown html attributes.

#### skipUnknownProperties
 
-   **Type**: boolean
-   **Default**: false
-   **Description**: Skip reporting unknown properties on elements.

#### skipUnknownSlots
 
-   **Type**: boolean
-   **Default**: false
-   **Description**: Skip reporting unknown slot names.

#### skipTypeChecking
 
-   **Type**: boolean
-   **Default**: false
-   **Description**: Skip type checking of attributes and properties.
  
### Extra data
#### globalTags
 
-   **Type**: string[]
-   **Description**: List of html tag names that you expect to be present at all times.
 
#### globalAttributes
 
-   **Type**: string[]
-   **Description**: List of html attributes names that you expect to be present at all times.

#### globalEvents
 
-   **Type**: string[]
-   **Description**: List of event names that you expect to be present at all times.

#### customHtmlData
 
-   **Type**: [Vscode custom HTML data format](https://github.com/Microsoft/vscode-html-languageservice/blob/master/docs/customData.md) you can both specify a relative file paths or an entire objects with the data here. This value can both be an array and an object.
-   **Description**: This plugin support the [custom vscode html data format](https://code.visualstudio.com/updates/v1_31#_html-and-css-custom-data-support) through this setting.
 