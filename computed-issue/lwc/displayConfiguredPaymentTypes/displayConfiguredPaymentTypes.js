import { LightningElement } from "lwc";
import { configuredPaymentTypes } from "c/paymentTypesStore";
import { $computed } from "c/signals";

export default class DisplayConfiguredPaymentTypes extends LightningElement {
  configured = $computed(() => (this.configured = configuredPaymentTypes.value))
    .value;

  // registered = registeredPaymentComponents.value;
  //
  // connectedCallback() {
  //   $effect(() => {
  //     console.log("registered changed", JSON.stringify(registeredPaymentComponents.value));
  //     this.registered = [...registeredPaymentComponents.value];
  //   });
  // }
}
