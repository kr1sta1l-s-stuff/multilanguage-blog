import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Comment, Publication } from '../api/types';
import { getPublication } from '../api/publications';
import { deleteComment, getComments, updateComment } from '../api/comments';
import CommentList from '../components/CommentList';
import CommentForm, { type ReplyTarget } from '../components/CommentForm';
import Pagination from '../components/Pagination';
import { useAuth } from '../hooks/useAuth';
import { FormatDateTime } from '../components/Utils';

export default function PublicationPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentPages, setCommentPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.resolve().then(() => {
      setLoading(true);
      setError('');
    });
    Promise.all([getPublication(id), getComments(id, 1)])
      .then(([pub, commentsData]) => {
        setPublication(pub);
        setComments(commentsData.items);
        setCommentPages(commentsData.pages);
        setCommentPage(commentsData.page);
      })
      .catch(() => setError('Failed to load publication.'))
      .finally(() => setLoading(false));
  }, [id]);

  const loadComments = (page: number) => {
    if (!id) return;
    getComments(id, page).then((data) => {
      setComments(data.items);
      setCommentPage(data.page);
      setCommentPages(data.pages);
    });
  };

  const handleCommentAdded = (comment: Comment) => {
    setComments((prev) => [comment, ...prev]);
  };

  const handleCommentDeleted = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => {
        const target = prev.find((c) => c.id === commentId);
        const isRootWithReplies =
          target != null &&
          !target.thread_id &&
          prev.some((c) => c.thread_id === commentId);
        if (isRootWithReplies) {
          return prev.map((c) =>
            c.id === commentId ? { ...c, is_deleted: true, content: '' } : c,
          );
        }
        return prev.filter((c) => c.id !== commentId);
      });
      setPublication((prev) =>
        prev ? { ...prev, comments_count: Math.max(0, prev.comments_count - 1) } : prev
      );
    } catch {
      alert('Не удалось удалить комментарий.');
    }
  };

  const handleCommentEdited = async (commentId: string, content: string) => {
    try {
      const updated = await updateComment(commentId, content);
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    } catch {
      alert('Не удалось обновить комментарий.');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!publication) return <p>Publication not found.</p>;

  return (
    <div className="publication-page">
      <article>
        <h1>{publication.title}</h1>
        <p className="publication-date">
          {FormatDateTime(publication.created_at)}
        </p>
        {publication.images.length > 0 && (
          <div className="publication-images">
            {publication.images.map((img) => (
              <img key={img.id} src={img.image_url} alt="" />
            ))}
          </div>
        )}
        <div className="publication-body">{publication.content}</div>
      </article>

      <section className="comments-section">
        <h2>Комментарии ({publication.comments_count})</h2>
        <CommentList
          comments={comments}
          currentUser={user}
          onDelete={handleCommentDeleted}
          onEdit={handleCommentEdited}
          onReply={setReplyTo}
        />
        <Pagination page={commentPage} pages={commentPages} onPageChange={loadComments} />
        {user && (
          <CommentForm
            publicationId={publication.id}
            onCommentAdded={handleCommentAdded}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        )}
      </section>
    </div>
  );
}
