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
        bool show;
        //ItemManager.ProductSteps _productStep;
    }

    struct Buyer_Log {
        mapping(uint => Item_Payments) _transaction;
        uint _buyerId; //
        uint _buyerIndex; //since one customer can have multiple transactions (for the same or different products), buyerIndex catalogs these transactions.
                          //This increases with each transaction and acts as the input for _transaction mapping.
    }

    struct Item_Payments {
        uint _quantity;
        ItemManager.ItemSteps _itemStep;
    }

    mapping(uint => S_Product) public products;
    mapping(address => Buyer_Log) public paymentAuth;
    uint index;
    

//ItemSteps tracks items, of which there may be many in a product category.
//i.e. Apples (the product) of which there are 100 individual items being tracked
    enum ItemSteps {Unpaid, Paid, Delivered} //removed created- allowing a quantity >1 for each item.

//ProductSteps tracks the products- Products are created with a number of items for sale, once those items are bought the product is SoldOut
    //enum ProductSteps {Created, SoldOut}

    event ProductStep(uint _productIndex, address _address, uint qty); //uint _step removed
    event ItemStep(uint _productIndex, address _buyerAddress, uint buyerIndex, uint qtyBought, uint _itemStep);

    function createItem(string memory _identifier, uint _priceInWei, uint _quantity) public onlyOwner returns(bool){
        ProductSale product = new ProductSale(this, _priceInWei, index, _quantity);
        products[index]._product = product;
        products[index]._identifier = _identifier;
        products[index]._priceInWei = _priceInWei;
        products[index]._quantity = _quantity;
        emit ProductStep(index, address(product), _quantity);
        index++;
        return(true);
    }

    function triggerPayment(uint _Ind, uint _qty, address buyer) public payable {
        ProductSale product = products[_Ind]._product;
        require(address(product) == msg.sender, "Only items are allowed to update themselves");
        require(products[_Ind]._quantity >= _qty, "The quantity you have ordered exceeds the available quantity");
        paymentAuth[buyer]._transaction[paymentAuth[buyer]._buyerIndex]._itemStep = ItemSteps.Paid;
        products[_Ind]._quantity -= _qty;
        paymentAuth[buyer]._transaction[paymentAuth[buyer]._buyerIndex]._quantity = _qty;
        emit ItemStep(_Ind, buyer, paymentAuth[buyer]._buyerIndex, _qty, uint( paymentAuth[buyer]._transaction[paymentAuth[buyer]._buyerIndex]._itemStep)); //removed: uint(items[_index]._step)
        emit ProductStep(_Ind, address(product),uint(products[_Ind]._quantity));
        paymentAuth[buyer]._buyerIndex++;
    }

    function triggerDelivery(uint _productIndex, address buyer, uint address_index, uint buyerIndex) public onlyOwner {
        require(paymentAuth[buyer]._transaction[buyerIndex]._itemStep == ItemSteps.Paid, "Item is further in the supply chain");
        paymentAuth[buyer]._transaction[buyerIndex]._itemStep = ItemSteps.Delivered;
        emit ProductStep(_productIndex, address(products[_productIndex]._product), products[_productIndex]._quantity);
        emit ItemStep(_productIndex, buyer, address_index, paymentAuth[buyer]._transaction[buyerIndex]._quantity, uint(paymentAuth[buyer]._transaction[buyerIndex]._itemStep)); //removed: uint(items[_index]._step)
    }

    function updateQuantity(uint newQuantity, uint itemIndex) public onlyOwner returns(bool) {
        products[itemIndex]._quantity = newQuantity;
        (bool success, ) = address(products[itemIndex]._product).call(abi.encodeWithSignature("update_Qty(uint256)",newQuantity));
        require(success, "Product quantity update failed, please try again");
        return(success);
    }

    function updateName(string memory newName, uint itemIndex) public onlyOwner returns(bool) {
        products[itemIndex]._identifier = newName;
        return(true);
    }

    function updateCost(uint newCost, uint itemIndex) public onlyOwner returns(bool) {
        products[itemIndex]._priceInWei = newCost;
        (bool success, ) = address(products[itemIndex]._product).call(abi.encodeWithSignature("update_Cost(uint256)",newCost));
        require(success, "Product quantity update failed, please try again");
        return(success);
    }

    function getIndexCount() public view returns(uint) {
        return(index);
    }

    function toggleShow (uint _ind) public returns(bool) {
        if(products[_ind].show == true) {
           products[_ind].show = false;
        }
        else {
            products[_ind].show = true;
        }
        return(products[_ind].show);
    }

    function productData(uint _index) public view returns(string memory, uint, uint, address, bool) {
        return(products[_index]._identifier, products[_index]._priceInWei, products[_index]._quantity, address(products[_index]._product), products[_index].show);
    }

     fallback () external payable {

     }

}