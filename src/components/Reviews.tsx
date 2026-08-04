import { useReviews } from "../context/ReviewsContext";
import "./Reviews.scss";

export default function Reviews() {
  const { reviews, loading } = useReviews();

  if (!loading && reviews.length === 0) return null;

  return (
    <section className="reviews" id="reviews">
      <div className="container">
        <p className="eyebrow">Відгуки</p>
        <h2 className="reviews__title">Що кажуть ті, хто вже замовляв</h2>

        {loading && <p className="reviews__status">Завантажую…</p>}

        {!loading && (
          <div className="reviews__grid">
            {reviews.map((review) => (
              <figure className="review-card" key={review.id}>
                {review.image && (
                  <img className="review-card__image" src={review.image} alt="" />
                )}
                <blockquote>{review.text}</blockquote>
                <figcaption>{review.name}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
