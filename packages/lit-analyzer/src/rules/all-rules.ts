import { RuleModule } from "../analyze/types/rule/rule-module";
import noBooleanInAttributeBindingRule from "./no-boolean-in-attribute-binding";
import noComplexAttributeBindingRule from "./no-complex-attribute-binding";
import noExpressionlessPropertyBindingRule from "./no-expressionless-property-binding";
import noIncompatiblePropertyType from "./no-incompatible-property-type";
import noIncompatibleTypeBindingRule from "./no-incompatible-type-binding";
import noInvalidAttributeName from "./no-invalid-attribute-name";
import noInvalidDirectiveBindingRule from "./no-invalid-directive-binding";
import noInvalidTagName from "./no-invalid-tag-name";
import noLegacyAttribute from "./no-legacy-attribute";
import noMissingElementTypeDefinition from "./no-missing-element-type-definition";
import noMissingImport from "./no-missing-import";
import noNullableAttributeBindingRule from "./no-nullable-attribute-binding";
import noPropertyVisibilityMismatch from "./no-property-visibility-mismatch";
import noUnclosedTag from "./no-unclosed-tag";
import noUnintendedMixedBindingRule from "./no-unintended-mixed-binding";
import noUnknownAttribute from "./no-unknown-attribute";
import noUnknownEvent from "./no-unknown-event";
import noUnknownProperty from "./no-unknown-property";
import noUnknownSlotRule from "./no-unknown-slot";
import noUnknownTagName from "./no-unknown-tag-name";

export const ALL_RULES: RuleModule[] = [
	noExpressionlessPropertyBindingRule,
	noUnintendedMixedBindingRule,
	noUnknownSlotRule,
	noNullableAttributeBindingRule,
	noComplexAttributeBindingRule,
	noBooleanInAttributeBindingRule,
	noInvalidDirectiveBindingRule,
	noIncompatibleTypeBindingRule,
	noMissingImport,
	noUnclosedTag,
	noUnknownTagName,
	noUnknownAttribute,
	noUnknownProperty,
	noUnknownEvent,
	noIncompatiblePropertyType,
	noInvalidTagName,
	noInvalidAttributeName,
	noPropertyVisibilityMismatch,
	noLegacyAttribute,
	noMissingElementTypeDefinition
];
