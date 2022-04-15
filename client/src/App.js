import React, { Component } from "react";
import ItemManagerContract from "./contracts/ItemManager.json";
import ProductSaleContract from "./contracts/ProductSale.json";
import getWeb3 from "./getWeb3";

import "./App.css";
import extension1 from './extension1.png';
import extension2 from './extension2.png';
import mylogo from './mylogo.png';
import 'bulma/css/bulma.min.css';

//const productMap = new Map();
const names = [];
const prices = [];
const amounts = [];
const indices = [];
const address = [];

class App extends Component {
  state = { loaded: false, cost: 0, itemName: "exampleItem1", 
  quantity: 0, index: 0, uquantity: 0, bquantity: 0, uname: "New Name", ucost: 0,
  itemNames: [], costs:[], quantities:[], indices:[], address:[]};

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
       address[i] = data[3];
    }
       this.setState({itemNames: names, costs: prices, quantities: amounts, indices: indices, address: address})
  
      //  productMap.set(i, {itemName: data[0], cost: data[1], quantity: data[2]});
      //setValues([...i, {itemName: data[0], cost: data[1], quantity: data[2] }]);
    
  }

  handleSubmit = async () => {
    const { cost, itemName, quantity } = this.state;
    if (itemName in this.state.itemNames) {
      alert("This name already exists, please choose a unique name or update the existing product!")
    }
    else {
    let result = await this.ItemManager.methods.createItem(itemName, cost, quantity).send({ from: this.accounts[0] });
    const index = result.events.ProductStep.returnValues._productIndex;
    names[index] = itemName; prices[index] = cost; amounts[index] = quantity; indices[index] = index; address[index] = result.events.ProductStep.returnValues._address;
    
    // productMap.set(index, {itemName: itemName, cost: cost, quantity: quantity});
    this.setState({itemNames: names, costs: prices, quantities: amounts, indices: indices, address:address})
    
    alert("Send "+cost+" Wei to "+result.events.ProductStep.returnValues._address);
    }
  };

  handleUpdate = async (input) => {
    if(input=="qty"){
    const { index, uquantity } = this.state;
    const update = await this.ItemManager.methods.updateQuantity(uquantity, index).send({ from: this.accounts[0] });
    if(!update){
      alert("Update unsuccessful, are you the owner?")
    }
    amounts[index] = uquantity;
    this.setState({quantities: amounts})
    console.log(this.state.quantities)
    alert("You updated the available quantity of "+this.state.itemNames[index]+" to "+this.state.quantities[index]);
  }

  else if(input=="name"){
    const { index, uname } = this.state;
    const oldName = this.state.itemNames[index];
    const update = await this.ItemManager.methods.updateName(uname, index).send({ from: this.accounts[0] });
    if(!update){
      alert("Update unsuccessful, are you the owner?")
    }
    names[index] = uname;
    this.setState({ItemNames: names})
    alert("You updated the name of "+oldName+" to "+this.state.itemNames[index]);
  }

  else{
    const { index, ucost } = this.state;
    const update = await this.ItemManager.methods.updateCost(ucost, index).send({ from: this.accounts[0] });
    if(!update){
      alert("Update unsuccessful, are you the owner?")
    }
    prices[index] = ucost;
    this.setState({costs: prices})
    alert("You updated the available quantity of "+this.state.itemNames[index]+" to "+this.state.costs[index]);
  }
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
        let item = await self.ItemManager.methods.items(evt.returnValues._itemIndex).call();
        alert("Item " + item._identifier + " was paid by " + item._buyerAddress+ " , deliver it now!");
      };
    });
  }

  buyItem =async(ind) => {
    const { costs, address } = this.state;
    if (this.state.quantities[ind] == 0) {
      alert("Sorry, this item is sold out!")
    }
    else {
    let success = await this.web3.eth.sendTransaction({to: address[ind], from:this.accounts[0], value: costs[ind]});
    if (!success) {alert("Payment unsuccesful")}
    let data =  await this.ItemManager.methods.productData(ind).call({ from: this.accounts[0] });
    amounts[ind] = data[2];
    this.setState({quantities: amounts});
    }
  }

  getProdInd = () => {
    const { itemName, itemNames } = this.state;
    if(itemName in itemNames){
    for (let i=0; i<=itemNames.length; i++){
      if (itemNames[i] == itemName){
        alert("The index of "+itemName+" is "+i);
      }
    }}
    else {
    alert("The item name was not found")
    }
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
        <h1>Simple Payment/Supply Chain Example!</h1>
        <p>Please let me know if you would like to see any other items listed!<br></br>
        All items are fictional!</p>
        <h1 style={{textDecorationLine:'underline'}}><strong>Products for sale:</strong></h1>
        
        <br></br>
        <div className="center">
        <table className="center" style={{border:'solid',}}>
          <thead className="has-text-black-bis" style={{backgroundColor:"#e6be8a"}}>
            <tr>
              <th >Product Name:</th>
              <th >Unit Price:</th>
              <th >Quantity Available:</th>
              <th >Buy!</th>
            </tr>
          </thead>
          <tbody className="has-text-black-bis">
            {this.state.indices.map((a) => (
              <tr className="rows">
                <td ><strong>{this.state.itemNames[a]}</strong></td>
                <td ><strong>{this.state.costs[a]}</strong></td>
                <td ><strong>{this.state.quantities[a]}</strong></td>
                <td >
                  Qty: <input type="text" className='input-bx' name="qty" value={this.state.bquantity} onChange={this.handleInputChange} />
                  <button type="button" className='create-btn' onClick={()=>this.buyItem(a)}> Buy!</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table> 
        </div>
        <br></br>

        <div style={{ borderTop: "2px solid #0f0f0f ", marginLeft: 100, marginRight: 100 }}></div>
        <button id="toggle" type="button" className= 'updates-btn' onClick={this.hideUpdates}>Show/Hide owner section</button>
        <div id="updates">

        <h2>Add a new product!</h2>
        Cost: <input type="text" className='input-bx' name="cost" value={this.state.cost} onChange={this.handleInputChange} />
         Product Name: <input type="text" className='input-bx' name="itemName" value={this.state.itemName} onChange={this.handleInputChange} />
         Quantity: <input type="text" className='input-bx' name="quantity" value={this.state.quantity} onChange={this.handleInputChange} />
        <button type="button" className='create-btn' onClick={this.handleSubmit}>Create new Item</button>
        <br></br>

        <h2>Get an item index!</h2>
        Product name: <input type="text" className='input-bx' name="itemName" value={this.state.itemName} onChange={this.handleInputChange} />
        <button type="button" className='qty-btn' onClick={this.getprodInd}>Update Quantity</button>
        <br></br>

        <h2>Update Product Quantity!</h2>
        Product index: <input type="text" className='input-bx' name="index" value={this.state.index} onChange={this.handleInputChange} />
         New Quantity: <input type="text" className='input-bx' name="uquantity" value={this.state.uquantity} onChange={this.handleInputChange} />
        <button type="button" className='qty-btn' onClick={()=>this.handleUpdate("qty")}>Update Quantity</button>
        <br></br>

        <h2>Update Product Name!</h2>
        Product index: <input type="text" className='input-bx' name="index" value={this.state.index} onChange={this.handleInputChange} />
         New Name: <input type="text" className='input-bx' name="uname" value={this.state.uname} onChange={this.handleInputChange} />
        <button type="button" className='qty-btn' onClick={()=>this.handleUpdate("name")}>Update Name</button>
        <br></br>

        <h2>Update Product Cost!</h2>
        Product index: <input type="text" className='input-bx' name="index" value={this.state.index} onChange={this.handleInputChange} />
         New Cost: <input type="text" className='input-bx' name="ucost" value={this.state.ucost} onChange={this.handleInputChange} />
        <button type="button" className='qty-btn' onClick={()=>this.handleUpdate("cost")}>Update Cost</button>
        <br></br>
        </div>

        

        <footer className='App-footer'>Modified by N.Milligan <br></br>
        For Udemy Ethereum Blockchain Developer Bootcamp with Solidity <br></br>
        <a textcolor='#808000' href="https://github.com/NicMilli/SupplyChain">View the source-code on GitHub!</a></footer>
      </div>
    );
  }
}

export default App;
