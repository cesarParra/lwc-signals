import { LightningElement } from "lwc";
import { $effect } from "c/signals";
import { messageEvent } from "c/demoSignals";
import sendMessage from "@salesforce/apex/ChatController.sendMessage";

export default class Chat extends LightningElement {
  sender = "User";
  message = "";

  messages = [];

  connectedCallback() {
    $effect(() => {
      if (messageEvent.value) {
        console.log("Message received in the component", messageEvent.value);
        this.messages = [...this.messages, messageEvent.value];
      }
    });
  }

  get formattedMessages() {
    return this.messages.map((message) => {
      return {
        ...message,
        listClasses:
          message.sender === this.sender
            ? "slds-chat-listitem slds-chat-listitem_outbound"
            : "slds-chat-listitem slds-chat-listitem_inbound",
        messageClasses:
          message.sender === this.sender
            ? "slds-chat-message__text slds-chat-message__text_outbound"
            : "slds-chat-message__text slds-chat-message__text_inbound"
      };
    });
  }

  handleNameChange(event) {
    this.sender = event.detail.value;
  }

  handleMessageChange(event) {
    this.message = event.detail.value;
  }

  get isMessageBoxDisabled() {
    return !this.sender;
  }

  get isSendDisabled() {
    return !this.message || !this.sender;
  }

  sendMessage() {
    sendMessage({
      message: this.message,
      sender: this.sender
    });
  }

  unsub() {
    messageEvent.unsubscribe((res) =>
      console.log("Unsubscribed from message channel", res)
    );
  }
}
