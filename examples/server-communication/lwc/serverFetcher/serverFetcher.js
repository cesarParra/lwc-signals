import { LightningElement } from "lwc";
import { $computed } from "c/signals";
import { fetchContacts } from "c/demoSignals";

export default class ServerFetcher extends LightningElement {
  contacts = $computed(() => (this.contacts = fetchContacts.value)).value;
}