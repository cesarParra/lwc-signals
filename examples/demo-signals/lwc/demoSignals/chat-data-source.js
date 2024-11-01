import { $signal, useEventBus } from "c/signals";

export const messageEvent = $signal(undefined, {
  storage: useEventBus(
    "/event/ChatMessage__e",
    ({ data }) => ({
      message: data.payload.Message__c,
      sender: data.payload.Sender__c,
      time: data.payload.Time__c
    }),
    {
      replayId: -2,
      onSubscribe: (message) => console.log("Subscribed to message", message)
    }
  )
});
