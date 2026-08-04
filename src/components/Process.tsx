import "./Process.scss";

interface Step {
  number: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: "01",
    title: "Заявка",
    description: "Ви пишете, що хочете: категорію, орієнтовний бюджет, дедлайн.",
  },
  {
    number: "02",
    title: "Ескіз & тканини",
    description: "Пропоную 2–3 варіанти з наявних тканин або підбираю під ідею.",
  },
  {
    number: "03",
    title: "Мірки",
    description: "Надсилаєте зріст і розмір — крою під вашу фігуру, а не по лекалу.",
  },
  {
    number: "04",
    title: "Пошиття",
    description: "5–14 днів, залежно від складності. Тримаю в курсі процесу.",
  },
  {
    number: "05",
    title: "Доставка",
    description: "Нова Пошта Україною. Приміряти, полюбити, носити.",
  },
];

export default function Process() {
  return (
    <section className="process">
      <div className="container">
        <p className="eyebrow eyebrow--on-dark">Процес</p>
        <h2 className="process__title">
          Від першого повідомлення до речі у вашій шафі —{" "}
          <span className="process__accent">5 кроків</span>.
        </h2>

        <ol className="process__list">
          {steps.map((step) => (
            <li className="process__step" key={step.number}>
              <span className="process__number">{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
