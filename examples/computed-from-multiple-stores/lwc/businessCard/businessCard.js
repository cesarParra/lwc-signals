import { LightningElement } from "lwc";
import { $computed } from "c/store";
import { accountName, contactName } from "c/demoStores";

export default class BusinessCard extends LightningElement {
  contactInfo = $computed(
    () =>
      (this.contactInfo = {
        accountName: accountName.value,
        contactName: contactName.value
      })
  );
}
