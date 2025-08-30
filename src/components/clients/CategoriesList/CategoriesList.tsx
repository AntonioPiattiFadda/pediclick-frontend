/* eslint-disable @typescript-eslint/no-explicit-any */
import  { useContext, useEffect, useState } from 'react';
import style from './CategoriesList.module.css';
import { SearchContext } from '../Context/SearchContext';
import { getCategories } from '@/service/categories';

const CategoriesList = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const { setSearchedCategory, searchedCategory } = useContext(SearchContext);

  useEffect(() => {
    getCategories('ads')
      .then((res) => {
        const newCategories = [
          'Todos',
          ...(res.categories || []).map((category: { name: string; }) => category.name),
        ];
        setCategories(newCategories);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const handleChangeCategory = (category: any) => {
    if (category === 'Todos') {
      setSearchedCategory('');
      return;
    }
    setSearchedCategory(category);
  };

  return (
    <div className={style.categories__container}>
      {categories.map((category) => {
        return (
          <span
            key={category}
            className={
              searchedCategory === category ? style.activeLink : style.category
            }
          >
            <button
              onClick={() => {
                handleChangeCategory(category);
              }}
              className={style.link}
            >
              {category}
            </button>
          </span>
        );
      })}
    </div>
  );
};

export default CategoriesList;
