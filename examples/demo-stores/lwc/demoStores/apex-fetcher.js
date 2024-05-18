import { $store, $resource, $effect } from "c/store";
import getHelloWorld from "@salesforce/apex/ResourceController.getHelloWorld";
import getAccountDetails from "@salesforce/apex/ResourceController.getAccountDetails";

export const fetchHelloWorld = $resource(getHelloWorld);

export const selectedAccountId = $store(null);

$effect(() => console.log(selectedAccountId.value));

export const getAccount = $resource(getAccountDetails, () => ({
  accountId: selectedAccountId.value
}));
