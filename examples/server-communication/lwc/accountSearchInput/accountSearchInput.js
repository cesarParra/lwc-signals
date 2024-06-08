import { LightningElement } from "lwc";
import { searchQuery } from "c/demoSignals";

export default class AccountSearchInput extends LightningElement {
  handleSearchChange(event) {
    searchQuery.value = event.target.value;
  }
}
