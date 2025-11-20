import { useContext, useEffect, useState } from "react";
import { SearchContext } from "../Context/SearchContext";
import styles from "./ItemListContainer.module.css";
// import NotFound from "../NoProductFound/NoProductFound";
import { getAllProducts } from "@/service/products";
// import { ProductsSkeleton } from "../../Utils/Skeletons";

// const transformProductsData = (data) => {
//   // const productsWithUnitPrice = data.filter((product) => {
//   //   return product.unit_prices.length > 0;
//   // });
//   return data.map((product) => ({
//     id: product.id,
//     name: product.product_name,
//     product_images: product.image,
//     description: product.description,
//     // category: product.category_id.name,
//     // unit_price: product.unit_prices,
//   }));
// };

// const filterProducts = (products, searchString, searchedCategory) => {
//   let filteredProducts = products;

//   if (searchString) {
//     const searchText = searchString.toLowerCase();
//     filteredProducts = filteredProducts.filter((product) =>
//       product.name.toLowerCase().includes(searchText)
//     );
//   }

//   if (searchedCategory) {
//     filteredProducts = filteredProducts.filter(
//       (product) => product.category === searchedCategory
//     );
//   }

//   return filteredProducts;
// };

const ItemListContainer = () => {
  const { searchString, searchedCategory } = useContext(SearchContext);
  const [loading, setLoading] = useState(true);
  // const [items, setItems] = useState([]);

  useEffect(() => {
    getAllProducts()
      .then((res) => {
        setLoading(true);
        console.log("res", res);
        // const mappedProducts = transformProductsData(res);
        // const filteredProducts = filterProducts(
        //   res.products,
        //   searchString,
        //   searchedCategory
        // );
        // if (filteredProducts.length === 0) {
        //   setItems([]);
        //   setLoading(false);
        // } else {
        //   setItems(filteredProducts);
        //   setLoading(false);
        // }
      })
      .catch((error) => {
        console.error(error);
      });
  }, [searchString, searchedCategory]);

  // if (items.length === 0 && searchString !== "") {
  //   // return <NotFound />;
  //   return <h1>No encontramos tu producto</h1>
  // }

  return (
    <div className={styles.itemListContainer}>
      {loading ? (
        <>
          <h1>Loading...</h1>
          {/* <ProductsSkeleton color="#36d7b7" /> */}
        </>
      ) : (
        <>
          <h1>Items list container</h1>
          {/* <ItemList items={items} /> */}
        </>
      )}
    </div>
  );
};

export default ItemListContainer;
