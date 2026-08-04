import "./Manifesto.scss";

const points: string[] = [
  "Один виріб — один власник",
  "Пошиття на ваші мірки",
  "Натуральні тканини",
  "Доставка Україною",
];

export default function Manifesto() {
  return (
    <section className="manifesto">
      <div className="container manifesto__inner">
        <p className="eyebrow">Маніфест</p>

        <h2 className="manifesto__title">
          Одяг, що робить <span className="italic-accent">заяву</span> без
          слів.
        </h2>

        <div className="manifesto__text">
          <p>
            Кожна річ народжується з другого життя матеріалів: старих
            сорочок, джинсів, скатертин, штор. Я розрізаю їх на фрагменти й
            збираю наново — так, щоб з них вийшло те, чого ще не було.
          </p>
          <p>
            Це не масмаркет. Це не «ще одна така сама». Це історія у крої,
            яку носить одна людина — ви.
          </p>
        </div>

        <ul className="manifesto__points">
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
