import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20],
  itemLabel = 'citas',
}: PaginationProps) {
  if (totalItems === 0) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  return (
    <nav
      aria-label="Navegación de páginas de citas"
      className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-line text-xs font-medium text-muted"
    >
      {/* Information text & page size selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Mostrando <strong className="text-cream font-semibold">{startItem}</strong> -{' '}
          <strong className="text-cream font-semibold">{endItem}</strong> de{' '}
          <strong className="text-gold font-bold">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-line">
            <label htmlFor="pageSizeSelect" className="text-muted hidden sm:inline">
              Por pág:
            </label>
            <select
              id="pageSizeSelect"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
              }}
              className="bg-surface-2 border border-line rounded-lg px-2 py-1 text-cream text-xs focus:outline-none focus:border-gold cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-surface-2 text-cream">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-line bg-surface-2 text-muted hover:text-cream hover:border-gold/40 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1"
        >
          <ChevronLeftIcon className="size-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-muted select-none">
                  …
                </span>
              );
            }

            const pageNum = p as number;
            const isCurrent = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                aria-label={`Ir a página ${pageNum}`}
                aria-current={isCurrent ? 'page' : undefined}
                className={`min-w-8 h-8 px-2 rounded-xl text-xs font-semibold transition ${
                  isCurrent
                    ? 'bg-gold text-night font-bold shadow-md shadow-gold/20'
                    : 'bg-surface-2 text-muted hover:text-cream hover:bg-surface border border-line'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Página siguiente"
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-line bg-surface-2 text-muted hover:text-cream hover:border-gold/40 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
    </nav>
  );
}
