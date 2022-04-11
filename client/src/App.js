import React, { Component } from "react";
import ItemManagerContract from "./contracts/ItemManager.json";
import ProductSaleContract from "./contracts/ProductSale.json";
import getWeb3 from "./getWeb3";
//import { useState } from "react";
//import ProductsTable from "./Components/ProductsTable";

import "./App.css";
import extension1 from './extension1.png';
import extension2 from './extension2.png';
import mylogo from './mylogo.png';

// const products = [
//   {index : 0, name: "Name", qty: 0, cost : 100, image : "mylogo"}
// ]

// const itemEvents = [
//   {index : 0, product : products[0]} // step = added || paid || delivered
// ]
// var items = [{itemName: "woo", cost:0, quantity: 0}];
// var productEvents = [{index: items}];
//const productMap = new Map();
// const el = [];
const names = [];
const prices = [];
const amounts = [];
const indices = [];

class App extends Component {
  state = { loaded: false, cost: 0, itemName: "exampleItem1", 
  quantity: 0, index: 0, uquantity: 0, itemNames: [], costs:[], quantities:[], indices:[]};

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();

      // Get the contract instance.
      this.networkId = await this.web3.eth.net.getId();
      
      this.ItemManager = new this.web3.eth.Contract(
        ItemManagerContract.abi,
        ItemManagerContract.networks[this.networkId] && ItemManagerContract.networks[this.networkId].address,
      );

      this.ProductSale = new this.web3.eth.Contract(
        ProductSaleContract.abi,
        ProductSaleContract.networks[this.networkId] && ProductSaleContract.networks[this.networkId].address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.listenToPaymentEvent();
      this.setState({ loaded:true }, this.getProducts);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  getProducts = async () => {
    let result = await this.ItemManager.methods.getIndexCount().call({ from: this.accounts[0] });
    for (let i=0; i<result; i++) {
       let data =  await this.ItemManager.methods.productData(i).call({ from: this.accounts[0] });
       names[i] = data[0];
       prices[i] = data[1];
       amounts[i] = data[2];
       indices[i] = i;
    }
       this.setState({itemNames: names, costs: prices, quantities: amounts, indices: indices})
  
      //  productMap.set(i, {itemName: data[0], cost: data[1], quantity: data[2]});
      //setValues([...i, {itemName: data[0], cost: data[1], quantity: data[2] }]);
    
  }

  handleSubmit = async () => {
    const { cost, itemName, quantity } = this.state;

    let result = await this.ItemManager.methods.createItem(itemName, cost, quantity).send({ from: this.accounts[0] });
    const index = result.events.ProductStep.returnValues._productIndex;
    names[index] = itemName; prices[index] = cost; amounts[index] = quantity; indices[index] = index;
    
    // productMap.set(index, {itemName: itemName, cost: cost, quantity: quantity});
    this.setState({itemNames: names, costs: prices, quantities: amounts, indices: indices})
    
    alert("Send "+cost+" Wei to "+result.events.ProductStep.returnValues._address);
  };

  handleUpdate = async () => {
    const { index, uquantity } = this.state;

    const update = await this.ItemManager.methods.updateQuantity(uquantity, index).send({ from: this.accounts[0] });
    if(!update){
      alert("Update unsuccessful, are you the owner?")
    }
    amounts[index] = uquantity;
    this.state.quantities[index] = uquantity;
    console.log(this.state.quantities)
    alert("You updated the available quantity of "+this.state.itemNames[index]+" to "+uquantity);
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  listenToPaymentEvent = () => {
    let self = this;
    this.ItemManager.events.ItemStep().on("data", async function(evt) {
      if(evt.returnValues._itemStep === 0) {
        let item = await self.IitemManager.methods.items(evt.returnValues._itemIndex).call();
        alert("Item " + item._identifier + " was paid by " + item._buyerAddress+ " , deliver it now!");
      };
    });
  }

  hideUpdates = () => {
    var x = document.getElementById('updates');
    if (x.style.display === 'none') {
        x.style.display = 'block';
    } 
    else {
        x.style.display = 'none';
       }
  }

  //  printValues = () => {
  //   for(let [key, value] of productMap){
  //     console.log(value.itemName +':'+ value.cost +':'+ value.quantity)
  //     return(
  //       <div>{value.itemName} {value.cost} {value.quantity}</div>
  //       )
  //   }
  //  }

//   printValues = async() => {
//     await this.getValues;
//   productMap.forEach((value, key) => {
//     data.push(
//       <tr>
//          <td>{key}</td>
//         <td>{value.itemName}</td>
//         <td>{value.cost}</td>
//       </tr>
//     );
//   });
//   console.log(data)
// }

  
  render() {
    
    if (!this.state.loaded) {
      return <div className="App">Loading Web3, accounts, and contract...<br></br>
        <h2>In order to buy coins, please install the metamask plugin on chrome or firefox and connect to the Ropsten test network.</h2> <br></br>
        <a href="https://metamask.io/download/">Download Metamask Extension For Your Browser!</a><br></br>
        You may need to show test networks in settings, advanced, show test networks.<br></br><br></br>Find and pin the Metamask extension in your browser<br></br>
        <img src={extension1} alt="Instructions"></img><br></br>then, select the Ropsten test network<br></br>
        <img src={extension2} alt="Instructions"></img><br></br>
        <br></br>You can then select 'buy' and request FREE test Ether from the test faucet.<br></br><br></br>
        <h2>Please refresh the page once connected</h2>
      </div>;
    }
    
    return (
      <div className="App">
        <header className='App-header' ><img className='App-logo' src={mylogo} alt="logo"/></header>
        <h1>Simply Payment/Supply Chain Example!</h1>
        <h2>Products for sale:</h2>

        {/*
        I have tried storing an object in the state which has names, cost, qty. 
        This worked well but I was unable to access it in here. Storing each in a different array
        in state I am able to render them in a vertical list format and even got each
        one in a different columns. Sadly these columns were not the same with as the headings and 
        I put <td> around <tr> which produced a lot of errors.
        I want each array to take a column in a table with all columns side by side.

        */}
       
        {this.state.itemNames[0]}
<table>
<thead>
        <tr>
            <th>Product Name</th>
            <th>Unit Price</th>
            <th>Quantity Available</th>
        </tr>
        </thead>
<tbody>

{this.state.itemNames.map((a, index) => (
      <tr>
        <td>{a}</td>
      </tr>
))}

</tbody>
</table> 

        <div style={{ borderTop: "2px solid #0f0f0f ", marginLeft: 500, marginRight: 500 }}></div>
        <button id="toggle" type="button" className= 'updates-btn' onClick={this.hideUpdates}>Show/Hide owner section</button>
        <div id="updates">

        <h2>Add a new product</h2>
        Cost: <input type="text" className='input-bx' name="cost" value={this.state.cost} onChange={this.handleInputChange} />
        Product Name: <input type="text" className='input-bx' name="itemName" value={this.state.itemName} onChange={this.handleInputChange} />
        Quantity: <input type="text" className='input-bx' name="quantity" value={this.state.quantity} onChange={this.handleInputChange} />
        <button type="button" className='create-btn' onClick={this.handleSubmit}>Create new Item</button>
        <br></br>

        <h2>Update Product Quantity</h2>
        Product index: <input type="text" className='input-bx' name="index" value={this.state.index} onChange={this.handleInputChange} />
        New Quantity: <input type="text" className='input-bx' name="uquantity" value={this.state.uquantity} onChange={this.handleInputChange} />
        <button type="button" className='qty-btn' onClick={this.handleUpdate}>Update Quantity</button>
        </div>

        <footer className='App-footer'>Modified by N.Milligan <br></br>
        For Udemy Ethereum Blockchain Developer Bootcamp with Solidity</footer>
      </div>
    );
  }
}

export default App;
