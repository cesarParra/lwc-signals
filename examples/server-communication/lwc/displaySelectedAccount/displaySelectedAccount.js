import { LightningElement } from "lwc";
import { $computed } from "c/store";
import { getAccount } from "c/demoStores";

export default class DisplaySelectedAccount extends LightningElement {
  account = $computed(() => (this.account = getAccount.value)).value;
}
