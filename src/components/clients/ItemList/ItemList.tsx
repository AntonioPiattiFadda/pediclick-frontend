/* eslint-disable @typescript-eslint/no-explicit-any */
import Item from '../Item/Item';
import styles from './ItemList.module.css';

const ItemList = ({ items }:{
  items: any
}) => {
  return (
    <>
      <div className={styles.itemList}>
         {items.map((element: any) => {
          return <Item key={element.id} element={element} />;
        })} 
        <div style={{ height: '4rem' }}></div>
      </div>
    </>
  );
};

export default ItemList;
