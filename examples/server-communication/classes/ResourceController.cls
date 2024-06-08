public without sharing class ResourceController {
    @AuraEnabled(Cacheable=true)
    public static List<Account> getAccounts() {
        return [SELECT Id, Name FROM Account];
    }

    @AuraEnabled
    public static Account getAccountDetails(Id accountId) {
        if (accountId == null) {
            return null;
        }
        return [SELECT Id, Name, Phone, Website FROM Account WHERE Id = :accountId];
    }

    @AuraEnabled
    public static List<Account> searchAccounts(String searchKey) {
        if (String.isBlank(searchKey)) {
            return new List<Account>();
        }
        String searchKeyWithWildcards = '%' + searchKey + '%';
        return [SELECT Id, Name FROM Account WHERE Name LIKE :searchKeyWithWildcards];
    }

    @AuraEnabled(Cacheable=true)
    public static List<Contact> getContacts() {
        return [SELECT Id, Name FROM Contact];
    }
}
