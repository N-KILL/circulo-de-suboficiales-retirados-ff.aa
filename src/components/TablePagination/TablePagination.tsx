import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  rowsPerPage: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalItems,
  rowsPerPage,
  itemLabel,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);

  const [inputVal, setInputVal] = useState(String(currentPage));

  const [prevPage, setPrevPage] = useState(currentPage);
  if (currentPage !== prevPage) {
    setPrevPage(currentPage);
    setInputVal(String(currentPage));
  }

  const submitPage = () => {
    const pageNum = parseInt(inputVal, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      setInputVal(String(currentPage));
    }
  };

  return (
    <div className="table-footer">
      <span className="showing-text">
        Mostrando {totalItems === 0 ? 0 : startIndex + 1} a {endIndex} de {totalItems} {itemLabel}
      </span>

      <div className="footer-controls">
        <div className="rows-selector">
          <span>Registros por página:</span>
          <select
            className="rows-select"
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          >
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        <div className="pagination" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* < Anterior */}
          <button
            className="page-btn"
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{ opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            title="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Primera página */}
          <button
            className={`page-btn${currentPage === 1 ? ' active' : ''}`}
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            style={{ minWidth: '36px', cursor: currentPage === 1 ? 'default' : 'pointer' }}
            title="Primera página"
          >
            1
          </button>

          {/* Input de página actual */}
          <input
            type="number"
            min={1}
            max={totalPages}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={submitPage}
            onKeyDown={(e) => e.key === 'Enter' && submitPage()}
            style={{
              width: '52px',
              textAlign: 'center',
              padding: '5px 4px',
              border: '1px solid var(--border, #ccc)',
              borderRadius: '6px',
              background: 'var(--card, #fff)',
              color: 'var(--foreground, #000)',
              outline: 'none',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          />

          {/* Última página */}
          <button
            className={`page-btn${currentPage === totalPages ? ' active' : ''}`}
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            style={{ minWidth: '36px', cursor: currentPage === totalPages ? 'default' : 'pointer' }}
            title="Última página"
          >
            {totalPages}
          </button>

          {/* > Siguiente */}
          <button
            className="page-btn"
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{ opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            title="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablePagination;
