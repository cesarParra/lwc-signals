import { LightningElement } from "lwc";
import { registeredPaymentTypeNames } from "c/paymentTypesStore";

export default class PaymentTypeRegistrant extends LightningElement {
  textValue = "";

  handleInputChange(event) {
    this.textValue = event.detail.value;
  }

  handleSubmit() {
    registeredPaymentTypeNames.value = [...registeredPaymentTypeNames.value, this.textValue];
    this.textValue = "";
    this.refs.paymentTypeInput.value = "";
  }
}
