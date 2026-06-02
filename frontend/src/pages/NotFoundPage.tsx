import { Link } from 'react-router-dom';
import { useT } from '../hooks/useT';

export default function NotFoundPage() {
  const t = useT();
  return (
    <div className="not-found-page">
      <h1>404</h1>
      <p>{t('notFound.message')}</p>
      <Link to="/publications" className="btn btn-primary">{t('notFound.toPublications')}</Link>
    </div>
  );
}
