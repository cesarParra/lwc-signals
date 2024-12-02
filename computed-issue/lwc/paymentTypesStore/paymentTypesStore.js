import { $resource, $signal, $computed, $effect } from "c/signals";
import getConfiguredPaymentTypes from "@salesforce/apex/ConfiguredPaymentTypesController.getConfiguredPaymentTypes";

export const { data: configuredPaymentTypes } = $resource(
  getConfiguredPaymentTypes
);

export const registeredPaymentTypeNames = $signal([]);

function intersection(...arrays) {
  return arrays.reduce((a, b) => a.filter(c => b.includes(c)));
}

export const availablePaymentTypes = $computed(() => {
  if (configuredPaymentTypes.value.loading) {
    return [];
  }

  const configuredPaymentTypeNames = configuredPaymentTypes.value.data.map(
    paymentType => paymentType.UniqueName
  );

  const valid = intersection(configuredPaymentTypeNames, registeredPaymentTypeNames.value);
  console.log('registered', JSON.stringify(registeredPaymentTypeNames.value));
  console.log('valid', JSON.stringify(valid));
  return configuredPaymentTypes.value.data.filter(pt => valid.includes(pt.UniqueName));
});

export const availablePaymentTypeOptions = $computed(() => availablePaymentTypes.value.map(pt => ({
  label: pt.DisplayName,
  value: pt.UniqueName
})));
