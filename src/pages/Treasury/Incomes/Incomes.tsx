import React, { useState, useEffect } from "react";
import { Search, Calendar, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TablePagination from "../../../components/TablePagination/TablePagination";
import "../TreasuryTables.css";

const Incomes: React.FC = () => {
  const navigate = useNavigate();
  
  // Expanded mock data (25 items)
  const incomes = [
    { fecha: "31/05/2024", concepto: "Cuota social Mayo 2024", categoria: "Cuotas Sociales", pagador: "Pérez, Juan Carlos", comprobante: "REC-000123", metodo: "Transferencia", importe: "$ 5.000,00" },
    { fecha: "30/05/2024", concepto: "Cuota social Mayo 2024", categoria: "Cuotas Sociales", pagador: "González, Roberto", comprobante: "REC-000122", metodo: "Efectivo", importe: "$ 5.000,00" },
    { fecha: "29/05/2024", concepto: "Cuota social Mayo 2024", categoria: "Cuotas Sociales", pagador: "López, Miguel Ángel", comprobante: "REC-000121", metodo: "Transferencia", importe: "$ 5.000,00" },
    { fecha: "28/05/2024", concepto: "Donación para eventos", categoria: "Donaciones", pagador: "Martinez, Carlos", comprobante: "REC-000120", metodo: "Transferencia", importe: "$ 10.000,00" },
    { fecha: "27/05/2024", concepto: "Alquiler salón quincho", categoria: "Alquileres", pagador: "Rodriguez, Ana", comprobante: "REC-000119", metodo: "Efectivo", importe: "$ 15.000,00" },
    { fecha: "26/05/2024", concepto: "Cuota social Mayo 2024", categoria: "Cuotas Sociales", pagador: "Sánchez, Diego", comprobante: "REC-000115", metodo: "Transferencia", importe: "$ 5.000,00" },
    { fecha: "25/05/2024", concepto: "Aporte extraordinario", categoria: "Aportes", pagador: "Vargas, Luis", comprobante: "REC-000114", metodo: "Efectivo", importe: "$ 25.000,00" },
    { fecha: "24/05/2024", concepto: "Cuota social Mayo 2024", categoria: "Cuotas Sociales", pagador: "Romero, Sofia", comprobante: "REC-000113", metodo: "Transferencia", importe: "$ 5.000,00" },
    { fecha: "23/05/2024", concepto: "Publicidad revista", categoria: "Publicidad", pagador: "Empresa ABC", comprobante: "REC-000112", metodo: "Transferencia", importe: "$ 12.000,00" },
    { fecha: "22/05/2024", concepto: "Cuota social Mayo 2024", categoria: "Cuotas Sociales", pagador: "Morales, Juan", comprobante: "REC-000111", metodo: "Efectivo", importe: "$ 5.000,00" },
    { fecha: "20/05/2024", concepto: "Cuota social Mayo 2024", categoria: "Cuotas Sociales", pagador: "Gimenez, Pedro", comprobante: "REC-000110", metodo: "Transferencia", importe: "$ 5.000,00" },
    { fecha: "19/05/2024", concepto: "Alquiler de cancha de fútbol", categoria: "Alquileres", pagador: "Torneo Amistoso", comprobante: "REC-000109", metodo: "Efectivo", importe: "$ 18.000,00" },
    { fecha: "18/05/2024", concepto: "Cuota social Mayo 2024", categoria: "Cuotas Sociales", pagador: "Castro, Mariana", comprobante: "REC-000108", metodo: "Transferencia", importe: "$ 5.000,00" },
    { fecha: "16/05/2024", concepto: "Venta de uniformes", categoria: "Ventas", pagador: "Socio Nuevo", comprobante: "REC-000107", metodo: "Efectivo", importe: "$ 8.500,00" },
    { fecha: "15/05/2024", concepto: "Cuota social Mayo 2024", categoria: "Cuotas Sociales", pagador: "Ortega, Hugo", comprobante: "REC-000106", metodo: "Tarjeta", importe: "$ 5.000,00" },
    { fecha: "14/05/2024", concepto: "Donación Anónima", categoria: "Donaciones", pagador: "Anónimo", comprobante: "REC-000105", metodo: "Transferencia", importe: "$ 50.000,00" },
    { fecha: "12/05/2024", concepto: "Cuota social Mayo 2024", categoria: "Cuotas Sociales", pagador: "Nuñez, Estela", comprobante: "REC-000104", metodo: "Transferencia", importe: "$ 5.000,00" },
    { fecha: "10/05/2024", concepto: "Inscripción torneo tenis", categoria: "Inscripciones", pagador: "Varios Participantes", comprobante: "REC-000103", metodo: "Efectivo", importe: "$ 30.000,00" },
    { fecha: "08/05/2024", concepto: "Cuota social Mayo 2024", categoria: "Cuotas Sociales", pagador: "Molina, Roberto", comprobante: "REC-000102", metodo: "Transferencia", importe: "$ 5.000,00" },
    { fecha: "07/05/2024", concepto: "Alquiler Salón de Fiestas", categoria: "Alquileres", pagador: "Socio Adherente", comprobante: "REC-000101", metodo: "Transferencia", importe: "$ 45.000,00" },
    { fecha: "05/05/2024", concepto: "Cuota social Mayo 2024", categoria: "Cuotas Sociales", pagador: "Acosta, Claudia", comprobante: "REC-000100", metodo: "Efectivo", importe: "$ 5.000,00" },
    { fecha: "04/05/2024", concepto: "Publicidad en cartelera", categoria: "Publicidad", pagador: "Comercio Vecinal", comprobante: "REC-000099", metodo: "Transferencia", importe: "$ 15.000,00" },
    { fecha: "03/05/2024", concepto: "Cuota social Mayo 2024", categoria: "Cuotas Sociales", pagador: "Rios, Fernando", comprobante: "REC-000098", metodo: "Transferencia", importe: "$ 5.000,00" },
    { fecha: "02/05/2024", concepto: "Aporte de auspiciante", categoria: "Aportes", pagador: "Pizzería El Sol", comprobante: "REC-000097", metodo: "Efectivo", importe: "$ 20.000,00" },
    { fecha: "01/05/2024", concepto: "Cuota social Mayo 2024", categoria: "Cuotas Sociales", pagador: "Benitez, Jorge", comprobante: "REC-000096", metodo: "Transferencia", importe: "$ 5.000,00" }
  ];

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const totalItems = incomes.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  // Adjust page if current page exceeds total pages after rows per page changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [rowsPerPage, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedIncomes = incomes.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="treasury-container">
      {/* Header row with "New" button */}
      <div className="treasury-header-row">
        <div style={{visibility: 'hidden'}}>spacer</div>
        <button 
          className="header-btn"
          onClick={() => navigate("/tesoreria/ingresos/nuevo-pago")}
        >
          <Plus size={18} />
          Nuevo Ingreso
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input type="text" className="search-input" placeholder="Buscar por concepto, socio, comprobante..." />
        </div>

        <div className="filter-item filter-item-date">
          <div className="input-with-icon">
            <input type="text" className="filter-select" defaultValue="01/05/2024 - 31/05/2024" />
            <Calendar size={16} className="input-icon" />
          </div>
        </div>
        
        <div className="filter-item">
          <select className="filter-select">
            <option>Todas las categorías</option>
          </select>
        </div>

        <div className="filter-item">
          <select className="filter-select">
            <option>Todos los métodos</option>
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
                <th>Concepto</th>
                <th>Categoría</th>
                <th>Socio / Pagador</th>
                <th>Comprobante</th>
                <th>Método de Pago</th>
                <th style={{textAlign: 'right'}}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {paginatedIncomes.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.fecha}</td>
                  <td>{item.concepto}</td>
                  <td>{item.categoria}</td>
                  <td>{item.pagador}</td>
                  <td>{item.comprobante}</td>
                  <td>{item.metodo}</td>
                  <td className="amount-ingreso" style={{textAlign: 'right'}}>{item.importe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <TablePagination
          currentPage={currentPage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
          itemLabel="ingresos"
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

export default Incomes;
