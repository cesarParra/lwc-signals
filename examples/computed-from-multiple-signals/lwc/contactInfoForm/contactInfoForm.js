import { LightningElement } from "lwc";
import { $computed } from "c/signals";
import { accountName, contactName } from "c/demoSignals";

export default class ContactInfoForm extends LightningElement {
  accountName = $computed(() => (this.accountName = accountName.value)).value;
  contactName = $computed(() => (this.contactName = contactName.value)).value;

  handleAccountNameChange(event) {
    accountName.value = event.target.value;
  }

  handleContactNameChange(event) {
    contactName.value = event.target.value;
  }
}