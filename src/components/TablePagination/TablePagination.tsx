import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  rowsPerPage: number;
  itemLabel: string; // e.g. "egresos", "ingresos", "movimientos"
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
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const renderPageButtons = () => {
    const buttons = [];
    for (let i = 1; i <= totalPages; i++) {
      buttons.push(
        <button
          key={i}
          className={`page-btn ${currentPage === i ? "active" : ""}`}
          onClick={() => onPageChange(i)}
        >
          {i}
        </button>
      );
    }
    return buttons;
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
            onChange={(e) => {
              onRowsPerPageChange(Number(e.target.value));
            }}
          >
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        <div className="pagination">
          <button 
            className="page-btn" 
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
            style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={16} />
          </button>
          {renderPageButtons()}
          <button 
            className="page-btn" 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages}
            style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablePagination;
