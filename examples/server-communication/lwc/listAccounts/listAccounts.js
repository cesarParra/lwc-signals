import { LightningElement, track, wire } from "lwc";
import getAccounts from "@salesforce/apex/ResourceController.getAccounts";
import { selectedAccountId } from "c/demoSignals";

export default class ListAccounts extends LightningElement {
  @track accounts = [];

  @wire(getAccounts)
  getAccounts({ error, data }) {
    if (data) {
      this.accounts = data.map((account) => ({
        label: account.Name,
        value: account.Id
      }));

      if (this.accounts.length > 0) {
        selectedAccountId.value = this.accounts[0].value;
      }
    } else if (error) {
      console.error(error);
    }
  }

  get currentAccountId() {
    return selectedAccountId.value;
  }

  handleAccountChange(event) {
    selectedAccountId.value = event.detail.value;
  }
}
