import { $signal, $resource, $effect } from "c/signals";
import getContacts from "@salesforce/apex/ResourceController.getContacts";
import getAccountDetails from "@salesforce/apex/ResourceController.getAccountDetails";
import searchAccounts from "@salesforce/apex/ResourceController.searchAccounts";

// serves the serverFetcher LWC
export const { data: fetchContacts } = $resource(getContacts);

// ---------------------------------------------------------

// serve the displaySelectedAccount and listAccounts LWCs
export const selectedAccountId = $signal(null);

$effect(() => console.log("selected Account Id", selectedAccountId.value));

export const { data: getAccount } = $resource(
  getAccountDetails,
  () => ({
    accountId: selectedAccountId.value
  }),
  {
    fetchWhen: () => selectedAccountId.value
  }
);

$effect(() =>
  console.log("the account changed", JSON.stringify(getAccount.value, null, 2))
);

// ---------------------------------------------------------

// Serves accountSearchInput and accountSearchResults LWCS
export const searchQuery = $signal("", {
  debounce: 1000
});

$effect(() => console.log("search query changed", searchQuery.value));

export const { data: searchAccs } = $resource(searchAccounts, () => ({
  searchKey: searchQuery.value
}));

$effect(() =>
  console.log("search results", JSON.stringify(searchAccs.value, null, 2))
);
