public with sharing class ShoppingCartController {
    @AuraEnabled(Cacheable=true)
    public static ShoppingCartDto getShoppingCart() {
        List<ItemDto> items = new List<ItemDto>();
        items.add(new ItemDto('1', 'Nomad Tumbler', new List<String>{'White'}, 1, 35.0, 'https://tailwindui.com/img/ecommerce-images/shopping-cart-page-01-product-03.jpg'));
        items.add(new ItemDto('2', 'Basic Tee', new List<String>{'Sienna', 'Large'}, 1, 32.0, 'https://tailwindui.com/img/ecommerce-images/shopping-cart-page-01-product-01.jpg'));
        return new ShoppingCartDto(items);
    }

    public class ItemDto {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public List<String> properties;
        @AuraEnabled public Integer quantity;
        @AuraEnabled public Decimal price;
        @AuraEnabled public String imgUrl;

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
