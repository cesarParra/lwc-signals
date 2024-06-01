public with sharing class ShoppingCartController {
    @AuraEnabled(Cacheable=true)
    public static ShoppingCartDto getShoppingCart() {
        return new ShoppingCartDto(buildSampleItemList());
    }

    @AuraEnabled
    public static ShoppingCartDto updateShoppingCart(List<ItemDto> newItems) {
        // This is just for example purpose, in a real-world scenario, you would update the shopping cart in the database
        return new ShoppingCartDto(newItems);
    }

    private static List<ItemDto> buildSampleItemList() {
        List<ItemDto> items = new List<ItemDto>();
        items.add(new ItemDto('1', 'Nomad Tumbler', new List<String>{'White'}, 1, 35.0, 'https://tailwindui.com/img/ecommerce-images/shopping-cart-page-01-product-03.jpg'));
        items.add(new ItemDto('2', 'Basic Tee', new List<String>{'Sienna', 'Large'}, 1, 32.0, 'https://tailwindui.com/img/ecommerce-images/shopping-cart-page-01-product-01.jpg'));
        return items;
    }

    private static final Decimal TAX_RATE = 0.1;
    public class ItemDto {
        @AuraEnabled public String id { get; set; }
        @AuraEnabled public String name { get; set; }
        @AuraEnabled public List<String> properties { get; set; }
        @AuraEnabled public Integer quantity { get; set; }
        @AuraEnabled public Decimal price { get; set; }
        @AuraEnabled public Decimal taxAmount { get {return (price * quantity) * TAX_RATE;} }
        @AuraEnabled public String imgUrl { get; set; }

        // No arg constructor so it can be built from JSON
        public ItemDto() {}

        public ItemDto(String id, String name, List<String> properties, Integer quantity, Decimal price, String imgUrl) {
            this.id = id;
            this.name = name;
            this.properties = properties;
            this.quantity = quantity;
            this.price = price;
            this.imgUrl = imgUrl;
        }
    }

    public class ShoppingCartDto {
        @AuraEnabled public List<ItemDto> items;

        public ShoppingCartDto(List<ItemDto> items) {
            this.items = items;
        }
    }
}
