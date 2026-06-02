import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import type { Page, Publication, RelatedTag } from '../api/types';
import type { PublicationOrder, PublicationSort } from '../api/publications';
import { getPublications } from '../api/publications';
import { getRelatedTags } from '../api/tags';
import PublicationCard from '../components/PublicationCard';
import PublicationModal from '../components/PublicationModal';
import CreatePublicationModal from '../components/CreatePublicationModal';
import PublicationsSortControls from '../components/PublicationsSortControls';
import Pagination from '../components/Pagination';
import { useAuth } from '../hooks/useAuth';
import { useT } from '../hooks/useT';

const SORT_VALUES: PublicationSort[] = ['date', 'likes', 'relevance'];
const ORDER_VALUES: PublicationOrder[] = ['asc', 'desc'];

const CAN_PUBLISH = 1;

export default function PublicationsPage() {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const { id: selectedId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const page = Number(searchParams.get('page')) || 1;
  const tagFilters = useMemo(() => searchParams.getAll('tags'), [searchParams]);
  const searchQuery = searchParams.get('q') ?? '';
  const searchActive = searchQuery.trim().length > 0;
  const sortParam = searchParams.get('sort');
  const orderParam = searchParams.get('order');
  const sort: PublicationSort = (() => {
    if (sortParam && (SORT_VALUES as string[]).includes(sortParam)) {
      const s = sortParam as PublicationSort;
      if (s === 'relevance' && !searchActive) return 'date';
      return s;
    }
    return searchActive ? 'relevance' : 'date';
  })();
  const order: PublicationOrder =
    orderParam && (ORDER_VALUES as string[]).includes(orderParam)
      ? (orderParam as PublicationOrder)
      : 'desc';
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

  const buildQuery = (
    overrides: {
      page?: number;
      tags?: string[];
      q?: string;
      sort?: PublicationSort | null;
      order?: PublicationOrder | null;
    } = {},
  ) => {
    const next = new URLSearchParams();
    const nextPage = overrides.page ?? page;
    if (nextPage > 1) next.set('page', String(nextPage));
    const nextTags = overrides.tags ?? tagFilters;
    nextTags.forEach((t) => next.append('tags', t));
    const nextQ = overrides.q !== undefined ? overrides.q : searchQuery;
    if (nextQ) next.set('q', nextQ);
    const nextSort = overrides.sort === undefined ? sortParam : overrides.sort;
    if (nextSort) next.set('sort', nextSort);
    const nextOrder = overrides.order === undefined ? orderParam : overrides.order;
    if (nextOrder) next.set('order', nextOrder);
    return next;
  };

  const fetchData = (
    targetPage: number,
    targetTags: string[],
    targetSearch: string,
    targetSort: PublicationSort,
    targetOrder: PublicationOrder,
  ) => {
    setError('');
    setRefreshing(true);
    return getPublications(targetPage, 20, targetTags, targetSearch, targetSort, targetOrder)
      .then(setData)
      .catch(() => setError(t('publications.loadFailed')))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  const handleCreated = () => {
    setCreateOpen(false);
    fetchData(page, tagFilters, searchQuery, sort, order);
  };

  const tagsKey = tagFilters.join(',');
  const pageQuery = (() => {
    const sp = buildQuery();
    const s = sp.toString();
    return s ? `?${s}` : '';
  })();

  const pinnedCommentId = searchParams.get('comment');

  const openPublication = (id: string) => {
    navigate(`/publications/${id}${pageQuery}`);
  };

  const closePublication = () => {
    navigate(`/publications${pageQuery}`);
  };

  const clearPinnedComment = () => {
    if (!selectedId) return;
    navigate(`/publications/${selectedId}${pageQuery}`, { replace: true });
  };

  useEffect(() => {
    fetchData(page, tagFilters, searchQuery, sort, order);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tagsKey, searchQuery, sort, order]);

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

  const handleSortChange = (next: PublicationSort) => {
    setSearchParams(buildQuery({ page: 1, sort: next }));
  };

  const handleOrderChange = (next: PublicationOrder) => {
    setSearchParams(buildQuery({ page: 1, order: next }));
  };

  if (loading) return <p>{t('common.loading')}</p>;
  if (error && !data) return <p className="error">{error}</p>;

  return (
    <div className={`publications-page${refreshing ? ' publications-page-refreshing' : ''}`}>
      <div className="publications-toolbar">
        <PublicationsSortControls
          sort={sort}
          order={order}
          searchActive={searchActive}
          onSortChange={handleSortChange}
          onOrderChange={handleOrderChange}
        />
        {tagFilters.length > 0 && (
          <div className="publications-active-filters">
            <span className="publications-active-filters-label">{t('publications.filter')}</span>
            {tagFilters.map((tag) => (
              <span key={tag} className="tag-chip tag-chip-active">
                {tag}
                <button
                  type="button"
                  className="tag-chip-remove"
                  onClick={() => removeTagFilter(tag)}
                  aria-label={t('publications.removeFilter', { tag })}
                >
                  &times;
                </button>
              </span>
            ))}
            <button type="button" className="tag-chip-clear" onClick={clearTagFilters}>
              {t('common.clear')}
            </button>
          </div>
        )}
      </div>
      {tagFilters.length > 0 && related.length > 0 && (
        <div className="publications-related-tags">
          <span className="publications-related-tags-label">{t('publications.relatedTags')}</span>
          {related.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="tag-chip tag-chip-clickable"
              onClick={() => onTagClick(tag.slug)}
              title={t('publications.tagCount', { count: tag.count })}
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
            <h2>{t('publications.notFound')}</h2>
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
          pinnedCommentId={pinnedCommentId}
          onClearPinned={clearPinnedComment}
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
