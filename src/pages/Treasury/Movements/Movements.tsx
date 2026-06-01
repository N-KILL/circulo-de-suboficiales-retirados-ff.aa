import React, { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import TablePagination from "../../../components/TablePagination/TablePagination";
import "../TreasuryTables.css";

/* ── helpers ───────────────────────────────────────────────── */
const toInputDate = (d: Date) => d.toISOString().split("T")[0]; // "YYYY-MM-DD"

const parseRowDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
};

/* ── component ─────────────────────────────────────────────── */
const Movements: React.FC = () => {

  // ── Mock data – June 2026 ─────────────────────────────────
  const movements = [
    { fecha: "30/06/2026", tipo: "Ingreso",  concepto: "Cuota social Junio 2026",          categoria: "Cuotas Sociales",   socio: "Pérez, Juan Carlos",         comprobante: "REC-000148", ingreso: "$ 5.000,00",    egreso: "-",           saldo: "$ 1.250.000,00" },
    { fecha: "30/06/2026", tipo: "Egreso",   concepto: "Pago servicio de luz",              categoria: "Servicios",         socio: "Edenor S.A.",                comprobante: "FAC-000512", ingreso: "-",             egreso: "$ 48.600,00",  saldo: "$ 1.201.400,00" },
    { fecha: "28/06/2026", tipo: "Ingreso",  concepto: "Cuota social Junio 2026",          categoria: "Cuotas Sociales",   socio: "González, Roberto",          comprobante: "REC-000147", ingreso: "$ 5.000,00",    egreso: "-",            saldo: "$ 1.250.000,00" },
    { fecha: "27/06/2026", tipo: "Egreso",   concepto: "Compra artículos limpieza",         categoria: "Mantenimiento",     socio: "Distribuidora del Sur",      comprobante: "FAC-000511", ingreso: "-",             egreso: "$ 21.300,00",  saldo: "$ 1.228.700,00" },
    { fecha: "26/06/2026", tipo: "Ingreso",  concepto: "Cuota social Junio 2026",          categoria: "Cuotas Sociales",   socio: "López, Miguel Ángel",        comprobante: "REC-000146", ingreso: "$ 5.000,00",    egreso: "-",            saldo: "$ 1.250.000,00" },
    { fecha: "25/06/2026", tipo: "Egreso",   concepto: "Combustible movilidad",             categoria: "Transporte",        socio: "YPF S.A.",                   comprobante: "FAC-000510", ingreso: "-",             egreso: "$ 14.800,00",  saldo: "$ 1.235.200,00" },
    { fecha: "24/06/2026", tipo: "Ingreso",  concepto: "Cuota social Junio 2026",          categoria: "Cuotas Sociales",   socio: "Ramirez, María",             comprobante: "REC-000145", ingreso: "$ 5.000,00",    egreso: "-",            saldo: "$ 1.250.000,00" },
    { fecha: "23/06/2026", tipo: "Egreso",   concepto: "Reparación PC Secretaría",          categoria: "Mantenimiento",     socio: "Sistemas Plus",              comprobante: "FAC-000509", ingreso: "-",             egreso: "$ 38.000,00",  saldo: "$ 1.212.000,00" },
    { fecha: "21/06/2026", tipo: "Ingreso",  concepto: "Cuota social Junio 2026",          categoria: "Cuotas Sociales",   socio: "Gomez, Pedro",               comprobante: "REC-000144", ingreso: "$ 5.000,00",    egreso: "-",            saldo: "$ 1.250.000,00" },
    { fecha: "20/06/2026", tipo: "Egreso",   concepto: "Artículos de librería",             categoria: "Administración",    socio: "Librería del Centro",        comprobante: "FAC-000508", ingreso: "-",             egreso: "$ 9.200,00",   saldo: "$ 1.240.800,00" },
    { fecha: "19/06/2026", tipo: "Ingreso",  concepto: "Cuota social Junio 2026",          categoria: "Cuotas Sociales",   socio: "Fernandez, Lucía",           comprobante: "REC-000143", ingreso: "$ 5.000,00",    egreso: "-",            saldo: "$ 1.250.000,00" },
    { fecha: "18/06/2026", tipo: "Egreso",   concepto: "Pago Internet Junio",               categoria: "Servicios",         socio: "Fibertel",                   comprobante: "FAC-000507", ingreso: "-",             egreso: "$ 13.500,00",  saldo: "$ 1.236.500,00" },
    { fecha: "17/06/2026", tipo: "Ingreso",  concepto: "Alquiler cancha de fútbol",         categoria: "Alquileres",        socio: "Torneo Amistoso",            comprobante: "REC-000142", ingreso: "$ 22.000,00",   egreso: "-",            saldo: "$ 1.258.500,00" },
    { fecha: "16/06/2026", tipo: "Egreso",   concepto: "Artículos de cafetería",            categoria: "Administración",    socio: "Supermercado Coto",          comprobante: "FAC-000506", ingreso: "-",             egreso: "$ 15.400,00",  saldo: "$ 1.236.500,00" },
    { fecha: "14/06/2026", tipo: "Egreso",   concepto: "Mantenimiento jardín",              categoria: "Mantenimiento",     socio: "Paisajismo Verde",           comprobante: "FAC-000505", ingreso: "-",             egreso: "$ 24.000,00",  saldo: "$ 1.251.900,00" },
    { fecha: "13/06/2026", tipo: "Ingreso",  concepto: "Cuota social Junio 2026",          categoria: "Cuotas Sociales",   socio: "Ortega, Hugo",               comprobante: "REC-000141", ingreso: "$ 5.000,00",    egreso: "-",            saldo: "$ 1.275.900,00" },
    { fecha: "12/06/2026", tipo: "Ingreso",  concepto: "Donación Anónima",                  categoria: "Donaciones",        socio: "Anónimo",                    comprobante: "REC-000140", ingreso: "$ 50.000,00",   egreso: "-",            saldo: "$ 1.270.900,00" },
    { fecha: "12/06/2026", tipo: "Egreso",   concepto: "Repuesto bomba de agua",            categoria: "Mantenimiento",     socio: "Sanitarios Central",         comprobante: "FAC-000504", ingreso: "-",             egreso: "$ 41.000,00",  saldo: "$ 1.220.900,00" },
    { fecha: "10/06/2026", tipo: "Ingreso",  concepto: "Cuota social Junio 2026",          categoria: "Cuotas Sociales",   socio: "Nuñez, Estela",              comprobante: "REC-000139", ingreso: "$ 5.000,00",    egreso: "-",            saldo: "$ 1.261.900,00" },
    { fecha: "10/06/2026", tipo: "Egreso",   concepto: "Servicio de Vigilancia",            categoria: "Seguridad",         socio: "SegurPlus S.A.",             comprobante: "FAC-000503", ingreso: "-",             egreso: "$ 125.000,00", saldo: "$ 1.256.900,00" },
    { fecha: "08/06/2026", tipo: "Ingreso",  concepto: "Inscripción torneo tenis",          categoria: "Inscripciones",     socio: "Varios Participantes",       comprobante: "REC-000138", ingreso: "$ 35.000,00",   egreso: "-",            saldo: "$ 1.381.900,00" },
    { fecha: "07/06/2026", tipo: "Egreso",   concepto: "Servicio telefónico e internet",    categoria: "Servicios",         socio: "Telecom Argentina",          comprobante: "FAC-000502", ingreso: "-",             egreso: "$ 31.200,00",  saldo: "$ 1.346.900,00" },
    { fecha: "05/06/2026", tipo: "Ingreso",  concepto: "Cuota social Junio 2026",          categoria: "Cuotas Sociales",   socio: "Molina, Roberto",            comprobante: "REC-000137", ingreso: "$ 5.000,00",    egreso: "-",            saldo: "$ 1.378.100,00" },
    { fecha: "04/06/2026", tipo: "Egreso",   concepto: "Honorarios contador",               categoria: "Honorarios",        socio: "Estudio Contable SRL",       comprobante: "FAC-000501", ingreso: "-",             egreso: "$ 28.000,00",  saldo: "$ 1.373.100,00" },
    { fecha: "02/06/2026", tipo: "Ingreso",  concepto: "Cuota social Junio 2026",          categoria: "Cuotas Sociales",   socio: "Gimenez, Pedro",             comprobante: "REC-000136", ingreso: "$ 5.000,00",    egreso: "-",            saldo: "$ 1.401.100,00" },
  ];

  // ── Default date range: current month ─────────────────────
  const now = new Date();
  const defaultFrom = toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const defaultTo   = toInputDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  // ── Filter state ───────────────────────────────────────────
  const [searchText,      setSearchText]      = useState("");
  const [dateFrom,        setDateFrom]        = useState(defaultFrom);
  const [dateTo,          setDateTo]          = useState(defaultTo);
  const [tipoFilter,      setTipoFilter]      = useState("Todos los tipos");
  const [categoriaFilter, setCategoriaFilter] = useState("Todas las categorías");

  // ── Dynamic category list ──────────────────────────────────
  const categorias = useMemo(() => {
    const unique = Array.from(new Set(movements.map((m) => m.categoria))).sort();
    return ["Todas las categorías", ...unique];
  }, []);

  // ── Filtered data ──────────────────────────────────────────
  const filteredMovements = useMemo(() => {
    const from   = new Date(dateFrom + "T00:00:00");
    const to     = new Date(dateTo   + "T23:59:59");
    const search = searchText.toLowerCase().trim();

    return movements.filter((m) => {
      const mDate = parseRowDate(m.fecha);

      const matchDate   = mDate >= from && mDate <= to;
      const matchSearch = !search ||
        m.concepto.toLowerCase().includes(search) ||
        m.socio.toLowerCase().includes(search)    ||
        m.comprobante.toLowerCase().includes(search);
      const matchTipo   = tipoFilter === "Todos los tipos" || m.tipo === tipoFilter;
      const matchCat    = categoriaFilter === "Todas las categorías" || m.categoria === categoriaFilter;

      return matchDate && matchSearch && matchTipo && matchCat;
    });
  }, [searchText, dateFrom, dateTo, tipoFilter, categoriaFilter]);

  // ── Pagination ─────────────────────────────────────────────
  const [currentPage,  setCurrentPage]  = useState(1);
  const [rowsPerPage,  setRowsPerPage]  = useState(15);

  const totalItems  = filteredMovements.length;
  const totalPages  = Math.ceil(totalItems / rowsPerPage);

  // Reset to page 1 whenever filters change
  useEffect(() => { setCurrentPage(1); }, [searchText, dateFrom, dateTo, tipoFilter, categoriaFilter]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [rowsPerPage, totalPages, currentPage]);

  const startIndex        = (currentPage - 1) * rowsPerPage;
  const paginatedMovements = filteredMovements.slice(startIndex, startIndex + rowsPerPage);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="treasury-container">

      {/* Filters Bar */}
      <div className="filters-bar">

        {/* Search */}
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por concepto, socio, comprobante..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Date range */}
        <div className="filter-item filter-item-date">
          <div className="date-range-inputs">
            <input
              type="date"
              className="filter-select date-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="date-separator">—</span>
            <input
              type="date"
              className="filter-select date-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {/* Tipo */}
        <div className="filter-item">
          <select
            className="filter-select"
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
          >
            <option>Todos los tipos</option>
            <option>Ingreso</option>
            <option>Egreso</option>
          </select>
        </div>

        {/* Categoría */}
        <div className="filter-item">
          <select
            className="filter-select"
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
          >
            {categorias.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Table Section */}
      <div className="table-card">
        <div className="table-wrapper">
          <table className="treasury-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Concepto</th>
                <th>Categoría</th>
                <th>Socio / Proveedor</th>
                <th>Comprobante</th>
                <th>Ingreso</th>
                <th>Egreso</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
                    No se encontraron movimientos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((m, idx) => (
                  <tr key={idx}>
                    <td>{m.fecha}</td>
                    <td>
                      <span className={`badge ${m.tipo === "Ingreso" ? "badge-ingreso" : "badge-egreso"}`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td>{m.concepto}</td>
                    <td>{m.categoria}</td>
                    <td>{m.socio}</td>
                    <td>{m.comprobante}</td>
                    <td className="amount-ingreso">{m.ingreso}</td>
                    <td className="amount-egreso">{m.egreso}</td>
                    <td className="amount-saldo">{m.saldo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <TablePagination
          currentPage={currentPage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
          itemLabel="movimientos"
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
};

export default Movements;
