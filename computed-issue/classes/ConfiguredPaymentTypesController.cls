public with sharing class ConfiguredPaymentTypesController {
    @AuraEnabled
    public static List<PaymentType> getConfiguredPaymentTypes() {
        return new List<PaymentType> {
            new PaymentType('Credit_Card'),
            new PaymentType('Debit_Card')
        };
    }

    public class PaymentType {
        @AuraEnabled
        public String UniqueName { get; set; }

        public PaymentType(String UniqueName) {
            this.UniqueName = UniqueName;
        }
    }
}
