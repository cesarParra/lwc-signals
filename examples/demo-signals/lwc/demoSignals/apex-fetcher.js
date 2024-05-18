import { $signal, $resource, $effect } from "c/signals";
import getContacts from "@salesforce/apex/ResourceController.getContacts";
import getAccountDetails from "@salesforce/apex/ResourceController.getAccountDetails";

export const { data: fetchContacts } = $resource(getContacts);

export const selectedAccountId = $signal(null);

$effect(() => console.log(selectedAccountId.value));

export const { data: getAccount } = $resource(getAccountDetails, () => ({
  accountId: selectedAccountId.value
}));

$effect(() =>
  console.log("the account changed", JSON.stringify(getAccount.value, null, 2))
);
