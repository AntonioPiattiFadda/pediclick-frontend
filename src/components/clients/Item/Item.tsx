import styles from './Item.module.css';
import { Link } from 'react-router-dom';

const Item = ({ element }) => {
  // const bestPrice = element.product_prices.reduce((minPrice, currentPrice) => {
  //   return currentPrice.value < minPrice.value ? currentPrice : minPrice;
  // }, element.unit_price[0]);

  // const minValue = bestPrice.price;

  // const noStockAtAll = element.unit_price.every((price) => price.stock === 0);
  const noStockAtAll = false;

  console.log(element);
  return (
    <>
      <Link
        className={styles.cardContainer}
        to={noStockAtAll ? undefined : `/itemDetail/${element.id}`}
      >
        <div className={styles.cardInfo}>
          <span className={styles.cardName}>{element.name}</span>
          <span className={styles.cardPrice}>
            {' '}
            <span className={styles.cardFrom}>desde</span>${element.product_prices[0].price}
          </span>
        </div>
        {noStockAtAll && (
          <div className={styles.noStockOvelayContainer}>
            <div className={styles.noStockOvelay}></div>
            <span className={styles.noStockSpan}>sin stock disponible</span>
          </div>
        )}
        <img className={styles.cardImage} src={element.product_images[0].url} alt="" />
      </Link>
    </>
  );
};
export default Item;
