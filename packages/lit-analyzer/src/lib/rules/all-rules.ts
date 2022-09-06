import { RuleModule } from "../analyze/types/rule/rule-module.js";
import noBooleanInAttributeBindingRule from "./no-boolean-in-attribute-binding.js";
import noComplexAttributeBindingRule from "./no-complex-attribute-binding.js";
import noExpressionlessPropertyBindingRule from "./no-expressionless-property-binding.js";
import noIncompatiblePropertyType from "./no-incompatible-property-type.js";
import noIncompatibleTypeBindingRule from "./no-incompatible-type-binding.js";
import noInvalidAttributeName from "./no-invalid-attribute-name.js";
import noInvalidDirectiveBindingRule from "./no-invalid-directive-binding.js";
import noInvalidTagName from "./no-invalid-tag-name.js";
import noLegacyAttribute from "./no-legacy-attribute.js";
import noMissingElementTypeDefinition from "./no-missing-element-type-definition.js";
import noMissingImport from "./no-missing-import.js";
import noNoncallableEventBindingRule from "./no-noncallable-event-binding.js";
import noNullableAttributeBindingRule from "./no-nullable-attribute-binding.js";
import noPropertyVisibilityMismatch from "./no-property-visibility-mismatch.js";
import noUnclosedTag from "./no-unclosed-tag.js";
import noUnintendedMixedBindingRule from "./no-unintended-mixed-binding.js";
import noUnknownAttribute from "./no-unknown-attribute.js";
import noUnknownEvent from "./no-unknown-event.js";
import noUnknownProperty from "./no-unknown-property.js";
import noUnknownSlotRule from "./no-unknown-slot.js";
import noUnknownTagName from "./no-unknown-tag-name.js";

export const ALL_RULES: RuleModule[] = [
	noExpressionlessPropertyBindingRule,
	noUnintendedMixedBindingRule,
	noUnknownSlotRule,
	noNoncallableEventBindingRule,
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
