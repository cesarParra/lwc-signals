public with sharing class ChatController {
    @AuraEnabled
    public static void sendMessage(String message, String sender) {
        EventBus.publish(new ChatMessage__e(
            Message__c = message,
            Sender__c = sender
        ));
    }
}
