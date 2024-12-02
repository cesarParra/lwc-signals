import { $resource, $signal, $computed, $effect } from "c/signals";
import getConfiguredPaymentTypes from "@salesforce/apex/ConfiguredPaymentTypesController.getConfiguredPaymentTypes";

export const { data: configuredPaymentTypes } = $resource(
  getConfiguredPaymentTypes
);

export const registeredPaymentComponents = $signal([], { track: true });

const computedFromTracked = $computed(() => registeredPaymentComponents.value);
$effect(() =>
  console.log(
    "computed from tracked changed (NOT REASSIGNED)",
    JSON.stringify(computedFromTracked.value)
  )
);
const computedFromTrackedReassigned = $computed(() => [
  ...registeredPaymentComponents.value
]);
$effect(() =>
  console.log(
    "computed from tracked changed (REASSIGNED)",
    JSON.stringify(computedFromTrackedReassigned.value)
  )
);

//
// function intersection(...arrays) {
//   return arrays.reduce((a, b) => a.filter(c => b.includes(c)));
// }
//
// const availablePaymentTypes = $computed(() => {
//   if (configuredPaymentTypes.data.loading) {
//     return [];
//   }
//
//   const configuredPaymentTypeNames = configuredPaymentTypes.data.value.map(
//     paymentType => paymentType.UniqueName
//   );
//
//   const valid = intersection(configuredPaymentTypeNames, registeredPaymentTypeNames.value);
//   return configuredPaymentTypes.data.value.filter(pt => valid.includes(pt.UniqueName));
// });
//
// const availablePaymentTypeOptions = $computed(() => availablePaymentTypes.value.map(pt => ({
//   label: pt.name,
//   value: pt.uniqueName
// })));
