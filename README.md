# Supply Chain
# [View the web app here!](https://nicmilli.github.io/SupplyChain)

This is a simple supply chain management project that I edited from the ['Ethereum Blockchain Developer With Solidity'](https://www.udemy.com/course/blockchain-developer) on Udemy.com.

This is my third project which helped me expand on my React app development skills. I learnt a lot about mapping through arrays to render them in a table in JSX. I learnt ways to make functions more dynamic and able to handle user inputs rather thank a hard coded function- see code highlights. I had many issues with styling the products table and discovered new css tricks to improve readability and styling. As well as many minor changes that can make the code more robust such as non-breaking spaces and mobile formatting.

When researching how to solve problems that arose in this project, I found that many developers often hard code variables in. This means that the page is not easy for clients to update themselves. I created this app so that no code changes will be needed adding or editing items. I also tried to make the code robust, alerting the user when a product with a duplicate name was input or whole numbers were not used (Prices are set in Wei due to the current scarcity of test ether and solidity can only take integer inputs).

Most importantly I identified new react skills that I would like to master. React hooks as well as file separation and organization will certainly help me take my skills to the next level. I experimented with separating components into separate files but ultimately opted to publish the project as is, to allow me to learn these techniques in a broader sense. I will be back soon to update this project with new skills!

In solidity I was able to further understand the usefulness of nesting mapping and structs. Creating child and parent contracts and the implications of gas costs on this strategy. Using low-level function calls to send ether between contracts.

# Skills Used:
* Blockchain:  
  Smart contract development   
   -Solidity  
   -Event triggers  
   -low-level functions like address.call()  
   -Workflow with Truffle  
  Smart contract deployment to Ropsten test network through Infura.io  
  Smart contract testing with Truffle  
* Front-end:  
  Array mapping  
  Alerts  
  Asynchronous functions  
  Smart contract interaction  
  Functions written to handle a variety of user-inputs  


# Technologies Used:
* Solidity
* Ropsten Test Network
* OpenZeppelin
* MetaMask
* Truffle
* Web3
* React
* CSS3
* HTML5
* Infura
* Git
* GitHub
* JavaScript
* Bulma

# Approach:
I started with the Supply Chain project which I did as part of the ['Ethereum Blockchain Developer With Solidity'](https://www.udemy.com/course/blockchain-developer). The project was designed to track products through the supply chain from listing, to sale and finally delivery. It was designed so that the ItemManager contract would create a child contract for each individual item. 

Thinking about the possible real-world uses for such a contract, online retail came to mind. In this case there are often many individual items for any given product and it would be very impractical to create a new contract for each item. 

Therefore, I changed the 'Item' contract to a 'ProductSale' which could track each type of product with many individual items. I displayed all the products created on the main web app and added buttons for users to buy the items through MetaMask. I hid the section where products are created as this does not concern the user (Although anyone can still access it for this example). I added the ability for users to change certain aspects of the products such as name and cost.

# Successes and short-comings:
* Success:
  * Mapping through arrays to render them in JSX.
  * The time to produce this project was much faster than my previous two projects.

* Short-comings:
  * Component organization
# Code Highlights:
The ItemManager contract creates a new instance of the ProductSale contract whenever the createItem function is called. This allows each product to be tracked and paid separately separately. This makes payments easy to track and categorize but gas costs are a consideration when deciding if this is the best option. The gas costs of creating a new contract were greatly reduced from the original version where each individual item would have a contract created. In this case the extra gas costs are still not favorable but a good learning excercise.

```solidity ItemManager Contract
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
```
The ProductSale contract demonstrates why gas costs can become an issue- each item is purchased from the ProductSale contract and the payment is sent along to the ItemManager contract using the lowlevel call address.call(). The recipient will lose this small portion of the sale. The effect of this can differ based on item costs and a possible solution could be for each ProductSale contract to store the funds. This too could be problematic if the owner wants to sell many goods.

```solidity ProductSale Contract
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
```
In JavaScript I believe that versatility is key to creating an efficient website for clients. When researching problems I found that many developers often hard code variables in, meaning that the page is not easy for clients to update themselves. I created this web app so that no alterations to the code should be needed and rather clients can alter any aspect within the 'owner section.' Many state variables are initialised as empty arrays allowing any number of products to be listed. The table and other functions were then designed to adapt to these changes. 

```javascript App.js
 <tbody className="has-text-black-bis">
            {this.state.indices.map((a) => (
              <tr className="rows">
                <td ><strong>{this.state.itemNames[a]}</strong></td>
                <td ><strong>{this.state.costs[a]} Wei</strong></td>
                <td ><strong>{this.state.quantities[a]}</strong></td>
                <td >
                  Qty: <input type="text" className='table-input' name="inputs" value={this.state.inputs[a]} onChange={this.handleInputChange} />
                  <button type="button" className='buy-btn' onClick={()=>this.buyItem(a)}> Buy!</button>
                </td>
              </tr>
            ))}
          </tbody>
```

I also believe that the client should be able to alter mistakes themselves so the listed products are able to be edited. When creating products the code ensures that no duplicate names are created and that whole numbers are used since prices are listed in Wei. This ensures a robust experience for both the client and customers.

```javascript App.js
  handleSubmit = async () => {
    const { cost, itemName, quantity, itemNames } = this.state;
    if (itemNames.includes(itemName)) {
      alert("This name already exists, please choose a unique name or update the existing product!")
    }
    else if(!Number.isInteger(Number(cost))){
      alert("Prices are in Wei, please only input whole numbers!")
    }
    else {
    let result = await this.ItemManager.methods.createItem(itemName, cost, quantity).send({ from: this.accounts[0] });
    const index = result.events.ProductStep.returnValues._productIndex;
    names[index] = itemName; prices[index] = cost; amounts[index] = quantity; indices[index] = index; address[index] = result.events.ProductStep.returnValues._address;
    
    this.setState({itemNames: names, costs: prices, quantities: amounts, indices: indices, address:address})
    alert("Send "+cost+" Wei to "+result.events.ProductStep.returnValues._address);
    }
  };
```

# What I still want to add:
* Hide products with supply of 0 from the page.
* More universal functions that can handle an array of different uses- similar to handleInputChange taken from the react websit.
