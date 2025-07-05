import React, { createContext, useEffect, useState } from 'react';

export const CartContext = createContext();

const CartContextProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  // JSON.parse(window.localStorage.getItem('CARRITO')) || []
  useEffect(() => {
    const newArray = [...cart];
    localStorage.setItem('CARRITO', JSON.stringify(newArray));
  }, [cart]);

  const addUnitPriceToProduct = (product, unitPrice) => {
    const updatedCart = [...cart];
    const existingProductIndex = updatedCart.findIndex(
      (item) => item.id === product.id
    );
    if (existingProductIndex !== -1) {
      const existingUnitPriceIndex = updatedCart[
        existingProductIndex
      ].unit_price.findIndex((up) => up.id === unitPrice.id);
      if (existingUnitPriceIndex !== -1) {
        updatedCart[existingProductIndex].unit_price[
          existingUnitPriceIndex
        ].quantity = 0;
      } else {
        unitPrice.quantity = 1;
        updatedCart[existingProductIndex].unit_price.push(unitPrice);
      }
    } else {
      const newUnitPrice = {
        ...unitPrice,
        quantity: 1,
      };
      const newProduct = {
        ...product,
        unit_price: [newUnitPrice],
      };

      updatedCart.push(newProduct);
    }
    setCart(updatedCart);
  };
  const addToCart = (selectedProduct) => {
    let dobbleProduct = isInCart(selectedProduct.id);
    if (dobbleProduct) {
      let newArray = cart.map((product) => {
        if (selectedProduct.id === product.id) {
          return {
            ...product,
            quantity: product.quantity + 1,
          };
        }
        return product;
      });
      setCart(newArray);
    } else {
      setCart([...cart, selectedProduct]);
    }
  };

  const addOneUnitPriceQuantity = (product, unitPrice) => {
    const updatedCart = [...cart];
    const existingProductIndex = updatedCart.findIndex(
      (item) => item.id === product.id
    );
    if (existingProductIndex !== -1) {
      const existingUnitPriceIndex = updatedCart[
        existingProductIndex
      ].unit_price.findIndex((up) => up.id === unitPrice.id);
      if (existingUnitPriceIndex !== -1) {
        updatedCart[existingProductIndex].unit_price[
          existingUnitPriceIndex
        ].quantity += 1;
      }
    }

    setCart(updatedCart);
  };

  const addOneElement = (id) => {
    let newArray = cart.map((product) => {
      if (id === product.id) {
        return {
          ...product,
          quantity: product.quantity + 1,
        };
      }
      return product;
    });
    setCart(newArray);
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartQuantity = () => {
    const total = cart.reduce((acc, element) => {
      return acc + element.quantity;
    }, 0);
    return total;
  };

  const getProductQuantityByID = (id) => {
    const filteredProduct = cart.find((product) => product.id === id);
    return filteredProduct?.quantity;
  };

  const getQuantityForUnitPrice = (product, unitPrice) => {
    const productInCart = cart.find((item) => item.id === product.id);
    if (productInCart) {
      const unitPriceInProduct = productInCart.unit_price.find(
        (up) => up.id === unitPrice.id
      );
      if (unitPriceInProduct) {
        return unitPriceInProduct.quantity || 0;
      }
    }
    return 0;
  };

  const getCartTotalPrice = () => {
    const totalPerProduct = cart.map((product) => {
      const totalPerUnitPrice = product.unit_price.reduce((acc, unitPrice) => {
        return acc + unitPrice.quantity * unitPrice.price;
      }, 0);
      return totalPerUnitPrice;
    });
    const totalAllProducts = totalPerProduct.reduce((acc, total) => {
      return acc + total;
    }, 0);
    return totalAllProducts;
  };

  const minusOneElement = (id) => {
    const filteredProduct = cart.find((product) => product.id === id);
    if (filteredProduct.quantity > 0) {
      let newArray = cart.map((product) => {
        if (id === product.id) {
          return {
            ...product,
            quantity: product.quantity - 1,
          };
        }
        return product;
      });
      setCart(newArray);
    }
  };

  const isInCart = (id) => {
    return cart.some((elemento) => elemento.id === id);
  };

  const removeProduct = (id) => {
    const deletedProductIndex = cart.findIndex((product) => product.id === id);
    const newArray = [...cart];
    newArray.splice(deletedProductIndex, 1);
    setCart(newArray);
  };

  const removeUnitPriceFromProduct = (product, unitPrice) => {
    const updatedCart = [...cart];
    const existingProductIndex = updatedCart.findIndex(
      (item) => item.id === product.id
    );

    if (existingProductIndex !== -1) {
      const existingUnitPriceIndex = updatedCart[
        existingProductIndex
      ].unit_price.findIndex((up) => up.id === unitPrice.id);

      if (existingUnitPriceIndex !== -1) {
        updatedCart[existingProductIndex].unit_price.splice(
          existingUnitPriceIndex,
          1
        );

        if (updatedCart[existingProductIndex].unit_price.length === 0) {
          updatedCart.splice(existingProductIndex, 1);
        }

        setCart(updatedCart);
      }
    }
  };

  const isUnitPriceInCart = (id, unitPrice) => {
    return cart.some((cartItem) => {
      return (
        cartItem.id === id &&
        cartItem.unit_price.some((cartUnitPrice) => {
          return (
            cartUnitPrice.unit === unitPrice.unit && cartUnitPrice.quantity > 0
          );
        })
      );
    });
  };

  const minusOneUnitPriceQuantity = (product, unitPrice) => {
    const updatedCart = [...cart];
    const existingProductIndex = updatedCart.findIndex(
      (item) => item.id === product.id
    );
    if (existingProductIndex !== -1) {
      const existingUnitPriceIndex = updatedCart[
        existingProductIndex
      ].unit_price.findIndex((up) => up.id === unitPrice.id);
      if (existingUnitPriceIndex !== -1) {
        if (
          updatedCart[existingProductIndex].unit_price[existingUnitPriceIndex]
            .quantity === 1
        ) {
          return;
        }
        updatedCart[existingProductIndex].unit_price[
          existingUnitPriceIndex
        ].quantity -= 1;
      }
    }
    setCart(updatedCart);
  };

  const removeUnitPrice = (product, unitPrice) => {
    const updatedCart = [...cart];
    const existingProductIndex = updatedCart.findIndex(
      (item) => item.id === product.id
    );
    if (existingProductIndex !== -1) {
      const existingUnitPriceIndex = updatedCart[
        existingProductIndex
      ].unit_price.findIndex((up) => up.id === unitPrice.id);

      if (existingUnitPriceIndex !== -1) {
        updatedCart[existingProductIndex].unit_price.splice(
          existingUnitPriceIndex,
          1
        );
      }
      if (updatedCart[existingProductIndex].unit_price.length === 0) {
        updatedCart.splice(existingProductIndex, 1);
      }
    }
    setCart(updatedCart);
  };

  const data = {
    cart,
    addToCart,
    clearCart,
    removeProduct,
    getCartQuantity,
    getCartTotalPrice,
    getProductQuantityByID,
    addOneElement,
    minusOneElement,
    addUnitPriceToProduct,
    removeUnitPriceFromProduct,
    isUnitPriceInCart,
    getQuantityForUnitPrice,
    addOneUnitPriceQuantity,
    minusOneUnitPriceQuantity,
    removeUnitPrice,
  };
  return <CartContext.Provider value={data}>{children}</CartContext.Provider>;
};

export default CartContextProvider;
