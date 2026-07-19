import React from "react";
import { useNavigate } from "react-router-dom";
import TablePagination from "../../../components/TablePagination/TablePagination";
import { type CementerioGridItem } from "../../../services/cementeriosApi";
import { calcYearsAgo } from "../../../utils/format";
import { SortIcon, type SortField, type SortDir } from "./types";
import { PAGA_POR_LABEL } from "./constants";

interface CementerioTableProps {
  paginated: (CementerioGridItem & { reducible: boolean })[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  currentPage: number;
  totalItems: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

const CementerioTable: React.FC<CementerioTableProps> = ({
  paginated,
  sortField,
  sortDir,
  onSort,
  currentPage,
  totalItems,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const navigate = useNavigate();

  return (
    <div className="table-card">
      <div className="table-wrapper">
        <table className="treasury-table">
          <thead>
            <tr>
              <th className="sortable-th col-nicho" onClick={() => onSort("nicho")}>
                Nro de Nicho <SortIcon field="nicho" currentSort={sortField} currentDir={sortDir} />
              </th>
              <th className="sortable-th col-cant" onClick={() => onSort("cantOcupantes")}>
                Cant. Ocupantes <SortIcon field="cantOcupantes" currentSort={sortField} currentDir={sortDir} />
              </th>
              <th className="sortable-th col-arrendatario" onClick={() => onSort("arrendatario")}>
                Arrendatario <SortIcon field="arrendatario" currentSort={sortField} currentDir={sortDir} />
              </th>
              <th className="sortable-th col-telefono" onClick={() => onSort("telefono")}>
                Teléfono <SortIcon field="telefono" currentSort={sortField} currentDir={sortDir} />
              </th>
              <th className="sortable-th col-paga-por" onClick={() => onSort("pagaPor")}>
                Paga por <SortIcon field="pagaPor" currentSort={sortField} currentDir={sortDir} />
              </th>
              <th className="sortable-th col-fecha" onClick={() => onSort("fechaDePago")}>
                Fecha Último Pago <SortIcon field="fechaDePago" currentSort={sortField} currentDir={sortDir} />
              </th>
              <th className="sortable-th col-anios" onClick={() => onSort("anios")}>
                Años desde Último Pago <SortIcon field="anios" currentSort={sortField} currentDir={sortDir} />
              </th>
              <th className="sortable-th col-reducible" onClick={() => onSort("reducible")}>
                Reducible <SortIcon field="reducible" currentSort={sortField} currentDir={sortDir} />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
                  No se encontraron resultados.
                </td>
              </tr>
            ) : (
              paginated.map((item, idx) => (
                <tr
                  key={idx}
                  className="clickable-row"
                  onClick={() => navigate(`/tesoreria/cementerio/${item.nicho}`)}
                  title="Ver detalle del nicho"
                >
                  <td className="col-nicho">{item.nicho}</td>
                  <td className="col-cant">{item.cantOcupantes}</td>
                  <td className="col-arrendatario">{item.arrendatario}</td>
                  <td className="col-telefono">{item.telefono}</td>
                  <td className="col-paga-por">{PAGA_POR_LABEL[item.pagaPor.toUpperCase()] || item.pagaPor}</td>
                  <td className="col-fecha">{item.fechaDePago}</td>
                  <td className="col-anios">{(() => { const v = calcYearsAgo(item.fechaDePago); return v < 0 ? "—" : v; })()}</td>
                  <td className="col-reducible">
                    {item.reducible ? (
                      <span style={{ color: "var(--verde-exito)", fontWeight: 600 }}>Sí</span>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalItems={totalItems}
        rowsPerPage={rowsPerPage}
        itemLabel="nichos"
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </div>
  );
};

export default CementerioTable;
