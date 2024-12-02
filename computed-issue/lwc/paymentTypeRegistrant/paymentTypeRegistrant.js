import { LightningElement } from "lwc";
import { registeredPaymentComponents } from "c/paymentTypesStore";

export default class PaymentTypeRegistrant extends LightningElement {
  textValue = "";

  handleInputChange(event) {
    this.textValue = event.detail.value;
  }

  handleSubmit() {
    registeredPaymentComponents.value.push(this.textValue);
    this.textValue = "";
  }
}
