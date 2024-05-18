import { LightningElement } from "lwc";
import { $computed } from "c/signals";
import { getAccount } from "c/demoSignals";

export default class DisplaySelectedAccount extends LightningElement {
  account = $computed(() => (this.account = getAccount.value)).value;
}
