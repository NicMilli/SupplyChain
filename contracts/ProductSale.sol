pragma solidity 0.8.9;

import "./ItemManager.sol";

contract ProductSale {
    uint public priceInWei;
    uint public paidWei;
    uint public index;
    uint public quantity;

    ItemManager parentContract;

    constructor(ItemManager _parentContract, uint _priceInWei, uint _index, uint _quantity) {
        priceInWei = _priceInWei;
        index = _index;
        parentContract = _parentContract;
        quantity = _quantity;
    }

    uint numberPaid;
    //uint qty = _quantity;

    receive() external payable {
        require(msg.value == priceInWei, "Sorry, partial payments are not supported");
        require(paidWei % priceInWei == 0, "This item has already been paid for!");
        require(quantity != 0, "Sorry, this item is temporarily sold out");
        paidWei += msg.value;
        numberPaid = msg.value/priceInWei;
        quantity -= numberPaid;
        (bool success, ) = address(parentContract).call{value:msg.value}(abi.encodeWithSignature("triggerPayment(uint256, uint256, address)", index, numberPaid, msg.sender));
        require(success, "Payment processing failed, please contact the owner");
    }

    function updateQty(uint newQty) public {
        require(address(parentContract) == msg.sender, "Only the master contract can update item quantity");
        quantity = newQty;
    }

     fallback () external payable {

     }
}