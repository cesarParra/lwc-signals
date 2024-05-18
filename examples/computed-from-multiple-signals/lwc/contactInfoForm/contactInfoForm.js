import { LightningElement } from "lwc";
import { $reactTo } from "c/signals";
import { accountName, contactName } from "c/demoSignals";

export default class ContactInfoForm extends LightningElement {
  get accountName() {
    return $reactTo(accountName);
  }

  get contactName() {
    return $reactTo(contactName);
  }

  handleAccountNameChange(event) {
    accountName.value = event.target.value;
  }

  handleContactNameChange(event) {
    contactName.value = event.target.value;
  }
}
