import logoMark from "../assets/logo-mark.png";
import "./Footer.scss";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span className="footer__logo">
          <img className="footer__logo-mark" src={logoMark} alt="" aria-hidden="true" />
          butterfly <span className="italic-accent">upcycle</span>
        </span>
        <p className="footer__meta">
          © {year} Вікторія · Дніпро, Україна
        </p>
        <nav className="footer__links">
          <a href={`https://instagram.com/butterfly_upcyclex`} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href={`https://t.me/butterfly_upcyclex`} target="_blank" rel="noreferrer">
            Telegram
          </a>
        </nav>
      </div>
    </footer>
  );
}
