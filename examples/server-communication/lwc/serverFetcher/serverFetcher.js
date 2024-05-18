import { LightningElement } from "lwc";
import { $computed } from "c/store";
import { fetchContacts } from "c/demoStores";

export default class ServerFetcher extends LightningElement {
  contacts = $computed(() => (this.contacts = fetchContacts.value)).value;
}
