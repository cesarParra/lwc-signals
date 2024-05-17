import { LightningElement } from "lwc";
import { $computed } from "c/store";
import { accountName, contactName } from "c/demoStores";

export default class ContactInfoForm extends LightningElement {
  accountName = $computed(() => (this.accountName = accountName.value));
  contactName = $computed(() => (this.contactName = contactName.value));

  handleAccountNameChange(event) {
    accountName.value = event.target.value;
  }

  handleContactNameChange(event) {
    contactName.value = event.target.value;
  }
}
