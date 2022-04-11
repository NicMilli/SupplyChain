import React from 'react'

function ProductsTable(props) {
      const {productEvents} = props

      return(
      <div className="ProductsTable">
          {productEvents.map(event=> (
          <div>
           <p>Item: {event.itemName}</p>
           <p>Cost: {event.cost}</p>
           <p>Quantity: {event.quantity}</p>
          </div>
          ))}

      </div>
    )
  } 

export default ProductsTable;