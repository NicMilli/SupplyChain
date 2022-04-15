import React, { Component } from "react";

export default ({ children, condition }) => {
    const shouldRender = typeof condition === 'function'
        ? condtion()
        : !!condition

    if(!shouldRender) return null

    return children
}
