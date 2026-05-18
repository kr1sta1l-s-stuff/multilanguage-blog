import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <h1>404</h1>
      <p>Кажется, тут ничего нет...</p>
      <Link to="/publications" className="btn btn-primary">Перейти к публикациям</Link>
    </div>
  );
}
