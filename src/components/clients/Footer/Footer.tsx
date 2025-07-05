import styles from './Footer.module.css';
import CompletarPedido from '@/assets/svg/CompletarPedido.svg';
import Carrito from '@/assets/svg/carrito.svg';
import { Link, useLocation } from 'react-router-dom';

function Footer() {
  const location = useLocation();
  if (location.pathname === '/cart') {
    return (
      <footer className={styles['footer-container']}>
        <Link className={styles['footer-link']} to={'/checkoutForm'}>
          <div className={styles['footer-card']}>
            <div className={styles['footer-info']}>
              <img
                className={styles['footer-icon']}
                src={CompletarPedido}
                alt="Icono de ir hacia completar el pedido"
              />
              <span>Completar pedido</span>
            </div>
          </div>
        </Link>
      </footer>
    );
  }

  if (location.pathname === '/checkoutForm') {
    return;
  }

  return (
    <footer className={styles['footer-container']}>
      <Link className={styles['footer-link']} to={'/cart'}>
        <div className={styles['footer-card']}>
          <div className={styles['footer-info']}>
            <img
              className={styles['footer-icon']}
              src={Carrito}
              alt="Icono de carrito"
            />
            <span>Ir a tu pedido</span>
          </div>
        </div>
      </Link>
    </footer>
  );
}

export default Footer;
