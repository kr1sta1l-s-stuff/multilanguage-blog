interface Props {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pages, onPageChange }: Props) {
  if (pages <= 1) return null;

  return (
    <div className="pagination">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="btn btn-secondary"
      >
        Previous
      </button>
      <span className="pagination-info">
        {page} / {pages}
      </span>
      <button
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
        className="btn btn-secondary"
      >
        Next
      </button>
    </div>
  );
}
