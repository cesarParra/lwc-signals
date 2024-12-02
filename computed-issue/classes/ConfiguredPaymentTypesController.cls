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

        @AuraEnabled
        public String DisplayName {
            get {
                return this.UniqueName.replace('_', ' ');
            }
        }

        public PaymentType(String UniqueName) {
            this.UniqueName = UniqueName;
        }
    }
}
