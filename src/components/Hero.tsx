import { Link } from "react-router-dom";
import aboutPhoto from "../assets/about-photo.jpg";
import "./Hero.scss";

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container hero__inner">
        <h1 className="hero__title">
          Шию неповторне
          <br />з неочікуваного.
        </h1>

        <p className="hero__lead">
          Стара сорочка, шматок деніму чи забуті штори — я даю їм друге життя
          у вигляді одягу, який більше ніде не повториться. Жодних тиражів:
          один фрагмент тканини — один виріб, один власник.
        </p>

        <div className="hero__actions">
          <Link to="/catalog" className="btn btn--primary">
            Дивитись каталог
          </Link>
        </div>

        <div className="hero__about">
          <div
            className="hero__about-photo"
            style={{ backgroundImage: `url(${aboutPhoto})` }}
            aria-hidden="true"
          />
          <div className="hero__about-text">
            <p className="eyebrow eyebrow--plain">Вікторія</p>
            <p className="hero__about-role">Дизайнерка · кастомайзер · мрійниця</p>
            <p>
              Шию апсайклінг-одяг у Дніпрі з 2020 року. Кожна річ починається
              з тканини, яка мала стати сміттям, — а закінчується виробом,
              який носять роками. Люблю поєднувати фактури й давати старим
              речам форму, якої в них ще не було.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
