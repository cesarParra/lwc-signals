import { $signal, useEventBus } from "c/signals";

export const messageEvent = $signal(undefined, {
  storage: useEventBus("/event/ChatMessage__e", (response) => ({
    message: response.Message__c,
    sender: response.Sender__c,
    time: response.Time__c
  }))
});
