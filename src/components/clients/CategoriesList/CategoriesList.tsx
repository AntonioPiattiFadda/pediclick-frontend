import  { useContext, useEffect, useState } from 'react';
import style from './CategoriesList.module.css';
import { SearchContext } from '../Context/SearchContext';
import { getCategories } from '@/service';

const CategoriesList = () => {
  const [categories, setCategories] = useState([]);
  const { setSearchedCategory, searchedCategory } = useContext(SearchContext);

  useEffect(() => {
    getCategories()
      .then((res) => {
        const newCategories = [
          'Todos',
          ...res.map((category) => category.name),
        ];
        setCategories(newCategories);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const handleChangeCategory = (category) => {
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
