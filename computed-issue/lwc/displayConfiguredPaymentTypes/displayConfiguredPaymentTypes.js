import { LightningElement } from "lwc";
import { configuredPaymentTypes, availablePaymentTypes, availablePaymentTypeOptions } from "c/paymentTypesStore";
import { $computed } from "c/signals";

export default class DisplayConfiguredPaymentTypes extends LightningElement {
  configured = $computed(() => (this.configured = configuredPaymentTypes.value))
    .value;

  available = $computed(() => (this.available = availablePaymentTypes.value))
    .value;

  asOptions = $computed(() => (this.asOptions = availablePaymentTypeOptions.value))
    .value;
}
