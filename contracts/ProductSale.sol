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
    event test(uint num, uint qty, address ctrct);

    receive() external payable {
        ////require(msg.value == priceInWei, "Sorry, partial payments are not supported");
        require(paidWei % priceInWei == 0, "Sorry, partial payments are not accepted!");
       
        paidWei += msg.value;
        numberPaid = msg.value/priceInWei;
        require(quantity >= numberPaid, "Sorry, there is not enough stock to fulfill this order");
        quantity -= numberPaid;
         
        (bool success, ) = address(parentContract).call{value:msg.value}(abi.encodeWithSignature("triggerPayment(uint256,uint256,address)", index, numberPaid, msg.sender));
        require(success, "Payment processing failed, please contact the owner");
    }

    function updateQty(uint newQty) public {
        require(address(parentContract) == msg.sender, "Only the ItemManager contract can update item quantity");
        quantity = newQty;
    }

     fallback () external payable {

     }
}