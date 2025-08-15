import Lupa from '../../assets/svg/NotFoundMagnifyingGlass.svg';
import styles from './NoProductFound.module.css';

const NoProductFound = () => {
  return (
    <div className={styles.notfound_container}>
      <img src={Lupa} alt="Lupa que indica que no haz encotrado el producto" />
      <h2 className={styles.notfound_title}>Artículo no encontrado</h2>
      <span className={styles.notfound_subtitle}>
        Intenta buscar el artículo con <br></br> otra palabra clave.
      </span>
    </div>
  );
};

export default NoProductFound;
