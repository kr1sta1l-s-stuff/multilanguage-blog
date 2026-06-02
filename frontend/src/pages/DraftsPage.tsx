import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import type { Page, Publication } from '../api/types';
import { getDrafts } from '../api/publications';
import Pagination from '../components/Pagination';
import EditPublicationModal from '../components/EditPublicationModal';
import { FormatDateTime } from '../components/Utils';
import { useAuth } from '../hooks/useAuth';
import { useT } from '../hooks/useT';

const CAN_PUBLISH = 1;

export default function DraftsPage() {
  const t = useT();
  const { user } = useAuth();
  const canPublish = !!user && (user.rights & CAN_PUBLISH) !== 0;
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [data, setData] = useState<Page<Publication> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Publication | null>(null);

  const fetchData = (targetPage: number) => {
    setLoading(true);
    setError('');
    getDrafts(targetPage)
      .then(setData)
      .catch(() => setError(t('drafts.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!canPublish) return;
    fetchData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, canPublish]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: String(newPage) });
  };

  const handleUpdated = (pub: Publication) => {
    if (pub.published_at !== null) {
      setData((prev) =>
        prev ? { ...prev, items: prev.items.filter((p) => p.id !== pub.id) } : prev,
      );
    } else {
      setData((prev) =>
        prev
          ? { ...prev, items: prev.items.map((p) => (p.id === pub.id ? pub : p)) }
          : prev,
      );
    }
    setEditing(null);
  };

  const handleDeleted = (id: string) => {
    setData((prev) =>
      prev ? { ...prev, items: prev.items.filter((p) => p.id !== id) } : prev,
    );
    setEditing(null);
  };

  if (!canPublish) return <Navigate to="/publications" replace />;
  if (loading) return <p>{t('common.loading')}</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="publications-page">
      <h1 className="drafts-title">{t('drafts.title')}</h1>
      {!data || data.items.length === 0 ? (
        <div className="publications-empty">
          <div className="publications-empty-card">
            <h2>{t('drafts.empty')}</h2>
          </div>
        </div>
      ) : (
        <>
          <div className="drafts-list">
            {data.items.map((pub) => (
              <button
                key={pub.id}
                type="button"
                className="draft-card"
                onClick={() => setEditing(pub)}
              >
                <h2 className="draft-card-title">{pub.title || t('drafts.untitled')}</h2>
                <p className="draft-card-preview">{pub.content.slice(0, 220)}</p>
                <div className="draft-card-meta">
                  <span>{t('drafts.modified', { date: FormatDateTime(pub.created_at) })}</span>
                  {pub.tags.length > 0 && (
                    <span className="draft-card-tags">
                      {pub.tags.map((t) => t.name).join(', ')}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <Pagination page={data.page} pages={data.pages} onPageChange={handlePageChange} />
        </>
      )}

      {editing && (
        <EditPublicationModal
          publication={editing}
          onClose={() => setEditing(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
