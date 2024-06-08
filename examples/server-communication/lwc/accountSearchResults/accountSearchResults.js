import { LightningElement } from "lwc";
import { $computed } from "c/signals";
import { searchAccs } from "c/demoSignals";

export default class AccountSearchResults extends LightningElement {
  accounts = $computed(() => (this.accounts = searchAccs.value)).value;
}
