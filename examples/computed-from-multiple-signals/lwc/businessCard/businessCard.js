import { LightningElement } from "lwc";
import { $computed } from "c/signals";
import { accountName, contactName } from "c/demoSignals";

export default class BusinessCard extends LightningElement {
  contactInfo = $computed(
    () =>
      (this.contactInfo = {
        accountName: accountName.value,
        contactName: contactName.value
      })
  ).value;
}
