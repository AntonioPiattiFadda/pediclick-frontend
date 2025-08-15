import styles from './MobileMenu.module.css';
import HomeIcon from '@/assets/svg/InicioMobileMenuIcon.svg';
import ClockIcon from '@/assets/svg/HorarioMobileMenuIcon.svg';
import LocationIcon from '@/assets/svg/UbicacionMobileMenuIcon.svg';
import ContactIcon from '@/assets/svg/ContactoMobileMenuIcon.svg';
import SocialIcon from '@/assets/svg/RedesMobileMenuIcon.svg';
import CerrarIcon from '@/assets/svg/CerrarMenuMobileIcon.svg';

const MobileMenu = ({ openMenu, setOpenMenu }: {
  openMenu: boolean;
  setOpenMenu: (open: boolean) => void;
}) => {
  const handleCloseMenu = () => {
    setOpenMenu(false);
  };

  return (
    <>
      <div className={openMenu ? styles.MobileMenu : styles.MobileMenuClosed}>
        <img
          onClick={handleCloseMenu}
          src={CerrarIcon}
          alt="Cerrar menú"
          className={styles.closeIcon}
        />
        <div className={styles.linksWrapper}>
          <div className={styles.linksIcons}>
            <ul>
              <li>
                <img src={HomeIcon} alt="Inicio" />
              </li>
              <li>
                <img src={ClockIcon} alt="Horarios" />
              </li>
              <li>
                <img src={LocationIcon} alt="Horarios" />
              </li>
              <li>
                <img src={ContactIcon} alt="Horarios" />
              </li>
              <li>
                <img src={SocialIcon} alt="Horarios" />
              </li>
            </ul>
          </div>
          <div className={styles.linksAnchors}>
            <ul>
              <li>
                <a href="/">Inicio</a>
              </li>
              <li>
                <a href="/category/1">Horarios</a>
              </li>
              <li>
                <a href="/category/2">Ubicación</a>
              </li>
              <li>
                <a href="/category/2">Contacto</a>
              </li>
              <li>
                <a href="/category/3">Redes sociales</a>
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.callToActionWrapper}>
          <span>¿Te gusta la tienda?</span>
          <a rel="noreferrer" target="_blank" href="https://www.pediclick.es">
            ¡Crea la tuya!
          </a>
        </div>
      </div>
      <span
        className={
          openMenu ? styles.mobileMenuOverlay : styles.mobileMenuOverlayClosed
        }
      />
      <span
        className={
          openMenu ? styles.blockCartOverelay : styles.blockCartOverelayClosed
        }
      />
    </>
  );
};

export default MobileMenu;
