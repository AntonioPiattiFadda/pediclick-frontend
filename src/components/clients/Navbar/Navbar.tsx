import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import Hamburguer from '@/assets/svg/hamburger.svg';
import FlechaAtrasIcono from '@/assets/svg/FlechaAtras.svg';
import MobileMenu from '../MobileMenu/MobileMenu';
import CartWidget from '../CartWidget/CartWidget';
import SearchBar from '../SearchBar/SearchBar';

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const isCart = location.pathname === '/cart';
  const isItemDetail = location.pathname.includes('/itemDetail');
  const isCheckOutForm = location.pathname.includes('/checkoutForm');

  const handleOpenMenu = () => {
    setOpenMenu(!openMenu);
  };
  const handleClickBack = () => {
    navigate(-1);
  };

  return (
    <div className={styles.navbar__container}>
      <MobileMenu openMenu={openMenu} setOpenMenu={setOpenMenu} />

      <div className={styles.navbar__firstLine}>
        <div className={styles.navbar__menuMobile}>
          {!isCheckOutForm && !isCart && !isItemDetail ? (
            <img
              className={styles.navbar__menuMobile_icon}
              onClick={handleOpenMenu}
              src={Hamburguer}
              alt="Icono de menu"
            />
          ) : (
            <img
              className={styles.navbar__menuMobile_icon}
              onClick={handleClickBack}
              src={FlechaAtrasIcono}
              alt="Icono de menu"
            />
          )}
        </div>

        <div className={styles.navbar__logo_container}>
          <div className={styles.navbar__logo}>
            <Link to="/">
              <img
                src="https://cstqhybxydgcazbgjqrd.supabase.co/storage/v1/object/public/PediClick-panarce/Panarse_Logo%201x1_1.png"
                alt="Logo"
                className={styles.LogoPrincipal}
              />
            </Link>
          </div>
        </div>

        <CartWidget />
      </div>
      {!isCheckOutForm && !isCart && !isItemDetail && <SearchBar />}
    </div>
  );
};

export default Navbar;
