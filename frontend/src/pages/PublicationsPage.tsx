import { useEffect, useState } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import type { Page, Publication } from '../api/types';
import { getPublications } from '../api/publications';
import PublicationCard from '../components/PublicationCard';
import PublicationModal from '../components/PublicationModal';
import CreatePublicationModal from '../components/CreatePublicationModal';
import Pagination from '../components/Pagination';
import { useAuth } from '../hooks/useAuth';

const CAN_PUBLISH = 1;

export default function PublicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { id: selectedId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const page = Number(searchParams.get('page')) || 1;
  const { user } = useAuth();
  const [data, setData] = useState<Page<Publication> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const canPublish = !!user && (user.rights & CAN_PUBLISH) !== 0;

  const handleCreated = () => {
    setCreateOpen(false);
    setLoading(true);
    getPublications(page)
      .then(setData)
      .catch(() => setError('Failed to load publications.'))
      .finally(() => setLoading(false));
  };

  const pageQuery = searchParams.get('page') ? `?page=${page}` : '';

  const openPublication = (id: string) => {
    navigate(`/publications/${id}${pageQuery}`);
  };

  const closePublication = () => {
    navigate(`/publications${pageQuery}`);
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    getPublications(page)
      .then(setData)
      .catch(() => setError('Failed to load publications.'))
      .finally(() => setLoading(false));
  }, [page]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: String(newPage) });
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="publications-page">
      {canPublish && (
        <div className="publications-toolbar">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setCreateOpen(true)}
          >
            Создать публикацию
          </button>
        </div>
      )}
      {!data || data.items.length === 0 ? (
        <div className="publications-empty">
          <div className="publications-empty-card">
            <h2>No publications yet</h2>
          </div>
        </div>
      ) : (
        <>
          <div className="publications-list">
            {data.items.map((pub) => (
              <PublicationCard
                key={pub.id}
                publication={pub}
                onOpen={() => openPublication(pub.id)}
              />
            ))}
          </div>
          <Pagination page={data.page} pages={data.pages} onPageChange={handlePageChange} />
        </>
      )}

      {selectedId && (
        <PublicationModal
          publicationId={selectedId}
          onClose={closePublication}
        />
      )}

      {createOpen && (
        <CreatePublicationModal
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
