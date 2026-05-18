import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import type { Page, Publication, RelatedTag } from '../api/types';
import { getPublications } from '../api/publications';
import { getRelatedTags } from '../api/tags';
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
  const tagFilters = useMemo(() => searchParams.getAll('tags'), [searchParams]);
  const searchQuery = searchParams.get('q') ?? '';
  const { user } = useAuth();
  const [data, setData] = useState<Page<Publication> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [related, setRelated] = useState<RelatedTag[]>([]);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const canPublish = !!user && (user.rights & CAN_PUBLISH) !== 0;

  useEffect(() => {
    if (canPublish && searchParams.get('create') === '1') {
      setCreateOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPublish, searchParams]);

  const buildQuery = (overrides: { page?: number; tags?: string[]; q?: string } = {}) => {
    const next = new URLSearchParams();
    const nextPage = overrides.page ?? page;
    if (nextPage > 1) next.set('page', String(nextPage));
    const nextTags = overrides.tags ?? tagFilters;
    nextTags.forEach((t) => next.append('tags', t));
    const nextQ = overrides.q !== undefined ? overrides.q : searchQuery;
    if (nextQ) next.set('q', nextQ);
    return next;
  };

  const fetchData = (targetPage: number, targetTags: string[], targetSearch: string) => {
    setError('');
    setRefreshing(true);
    return getPublications(targetPage, 20, targetTags, targetSearch)
      .then(setData)
      .catch(() => setError('Failed to load publications.'))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  const handleCreated = () => {
    setCreateOpen(false);
    fetchData(page, tagFilters, searchQuery);
  };

  const tagsKey = tagFilters.join(',');
  const pageQuery = (() => {
    const sp = buildQuery();
    const s = sp.toString();
    return s ? `?${s}` : '';
  })();

  const openPublication = (id: string) => {
    navigate(`/publications/${id}${pageQuery}`);
  };

  const closePublication = () => {
    navigate(`/publications${pageQuery}`);
  };

  useEffect(() => {
    fetchData(page, tagFilters, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tagsKey, searchQuery]);

  useEffect(() => {
    if (tagFilters.length === 0) {
      setRelated([]);
      return;
    }
    let cancelled = false;
    getRelatedTags(tagFilters)
      .then((items) => {
        if (!cancelled) setRelated(items);
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagsKey]);

  const handlePageChange = (newPage: number) => {
    setSearchParams(buildQuery({ page: newPage }));
  };

  const removeTagFilter = (tag: string) => {
    const next = tagFilters.filter((t) => t !== tag);
    setSearchParams(buildQuery({ page: 1, tags: next }));
  };

  const clearTagFilters = () => {
    setSearchParams(buildQuery({ page: 1, tags: [] }));
  };

  const onTagClick = (slug: string) => {
    if (tagFilters.includes(slug)) return;
    setSearchParams(buildQuery({ page: 1, tags: [...tagFilters, slug] }));
  };

  if (loading) return <p>Loading...</p>;
  if (error && !data) return <p className="error">{error}</p>;

  return (
    <div className={`publications-page${refreshing ? ' publications-page-refreshing' : ''}`}>
      {tagFilters.length > 0 && (
        <div className="publications-toolbar">
          <div className="publications-active-filters">
            <span className="publications-active-filters-label">Фильтр:</span>
            {tagFilters.map((tag) => (
              <span key={tag} className="tag-chip tag-chip-active">
                {tag}
                <button
                  type="button"
                  className="tag-chip-remove"
                  onClick={() => removeTagFilter(tag)}
                  aria-label={`Убрать фильтр ${tag}`}
                >
                  &times;
                </button>
              </span>
            ))}
            <button type="button" className="tag-chip-clear" onClick={clearTagFilters}>
              Очистить
            </button>
          </div>
        </div>
      )}
      {tagFilters.length > 0 && related.length > 0 && (
        <div className="publications-related-tags">
          <span className="publications-related-tags-label">Похожие теги:</span>
          {related.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="tag-chip tag-chip-clickable"
              onClick={() => onTagClick(tag.slug)}
              title={`${tag.count} публикаций`}
            >
              {tag.name}
              <span className="tag-chip-count">{tag.count}</span>
            </button>
          ))}
        </div>
      )}
      {error && data && <p className="error">{error}</p>}
      {!data || data.items.length === 0 ? (
        <div className="publications-empty">
          <div className="publications-empty-card">
            <h2>Публикации не найдены</h2>
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
                onTagClick={onTagClick}
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
