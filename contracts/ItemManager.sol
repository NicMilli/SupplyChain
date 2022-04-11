pragma solidity 0.8.9;

import "./ProductSale.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

//For this contract Item refers to a single good sold,
//whilst product refers to the catagory of good- in which there may be multiple individual items.
contract ItemManager is Ownable {

    struct S_Product {
        ProductSale _product;
        //ItemManager.SupplyChainSteps _step;
        string _identifier;
        uint _priceInWei;
        uint _quantity;
        ItemManager.ProductSteps _productStep;
    }

    struct Item_Payments {
        mapping(uint => uint) _quantity;
        uint _addressIndex;
        mapping(uint => ItemManager.ItemSteps) _itemStep;
    }

    mapping(uint => S_Product) public products;
    mapping(address => Item_Payments) public paymentAuth;
    uint index;

//ItemSteps tracks items, of which there may be many in a product category.
//i.e. Apples (the product) of which there are 100 individual items being tracked
    enum ItemSteps {Unpaid, Paid, Delivered} //removed created- allowing a quantity >1 for each item.
//ProductSteps tracks the products- Products are created with a number of items for sale, once those items are bought the product is SoldOut
    enum ProductSteps {Created, SoldOut}

    event ProductStep(uint _productIndex, address _address, uint qty, uint _step); //uint _step removed
    event ItemStep(uint _productIndex, address _buyerAddress, uint _addressIndex, uint qtyBought, uint _itemStep);

    function createItem(string memory _identifier, uint _priceInWei, uint _quantity) public onlyOwner {
        ProductSale product = new ProductSale(this, _priceInWei, index, _quantity);
        products[index]._product = product;
        products[index]._productStep = ProductSteps.Created;
        products[index]._identifier = _identifier;
        products[index]._priceInWei = _priceInWei;
        products[index]._quantity = _quantity;
        emit ProductStep(index, address(product), _quantity, uint(products[index]._productStep));
        index++;
    }

    function triggerPayment(uint _productIndex, uint qty, address buyer) public payable {
        ProductSale product = products[_productIndex]._product;
        require(address(product) == msg.sender, "Only items are allowed to update themselves");
        require(product.priceInWei() == msg.value, "Not fully paid yet");
        require(products[_productIndex]._quantity >= qty && products[_productIndex]._quantity > 0, "The quantity you have ordered exceeds the available quantity");
        require(products[_productIndex]._productStep != ProductSteps.SoldOut, "This item is sold out, please contact us to find out when new stock will arrive");
        paymentAuth[buyer]._itemStep[paymentAuth[buyer]._addressIndex] = ItemSteps.Paid;
        products[_productIndex]._quantity -= qty;
        paymentAuth[buyer]._quantity[paymentAuth[buyer]._addressIndex] = qty;
        emit ItemStep(_productIndex, buyer, paymentAuth[buyer]._addressIndex, uint(paymentAuth[buyer]._itemStep[paymentAuth[buyer]._addressIndex]), qty); //removed: uint(items[_index]._step)
        emit ProductStep(_productIndex, address(products[_productIndex]._product), products[_productIndex]._quantity, uint(products[_productIndex]._productStep));
        paymentAuth[buyer]._addressIndex++;
        if (products[_productIndex]._quantity == 0){
            products[index]._productStep = ProductSteps.Created;
        }
    }

    function triggerDelivery(uint _productIndex, address buyer, uint address_index) public onlyOwner {
        require(paymentAuth[buyer]._itemStep[address_index] == ItemSteps.Paid, "Item is further in the supply chain");
        paymentAuth[buyer]._itemStep[address_index] = ItemSteps.Delivered;
        emit ProductStep(_productIndex, address(products[_productIndex]._product), products[_productIndex]._quantity, uint(products[_productIndex]._productStep));
        emit ItemStep(_productIndex, buyer, address_index, uint(paymentAuth[buyer]._itemStep[paymentAuth[buyer]._addressIndex]), paymentAuth[buyer]._quantity[paymentAuth[buyer]._addressIndex]); //removed: uint(items[_index]._step)
    }

    function updateQuantity(uint newQuantity, uint itemIndex, uint cost) public onlyOwner {
        require(cost == products[itemIndex]._priceInWei, "The cost does not match the item index, cannot update quantity"); //Stop malicious actors from creating false supplies.
        products[itemIndex]._quantity = newQuantity;
        (bool success, ) = address(products[itemIndex]._product).call(abi.encodeWithSignature("updateQty(uint256)", newQuantity));
        require(success, "Product quantity update failed, please try again");
    }

    function getIndexCount() public view returns(uint) {
        return(index);
    }

    function productData(uint _index) public view returns(string memory, uint, uint) {
        return(products[_index]._identifier, products[_index]._priceInWei, products[_index]._quantity);
    }

}