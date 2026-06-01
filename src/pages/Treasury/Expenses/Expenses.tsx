import React, { useState, useEffect } from "react";
import { Search, Calendar, Plus } from "lucide-react";
import TablePagination from "../../../components/TablePagination/TablePagination";
import "../TreasuryTables.css";

const Expenses: React.FC = () => {
  // Expanded mock data (25 items)
  const expenses = [
    { fecha: "31/05/2024", concepto: "Pago servicio de luz", categoria: "Servicios", proveedor: "Edenor S.A.", comprobante: "FAC-000456", metodo: "Transferencia", importe: "$ 45.230,00" },
    { fecha: "30/05/2024", concepto: "Compra de artículos limpieza", categoria: "Mantenimiento", proveedor: "Distribuidora del Sur", comprobante: "FAC-000455", metodo: "Transferencia", importe: "$ 18.750,00" },
    { fecha: "28/05/2024", concepto: "Combustible movilidad", categoria: "Transporte", proveedor: "YPF S.A.", comprobante: "FAC-000454", metodo: "Tarjeta", importe: "$ 12.500,00" },
    { fecha: "27/05/2024", concepto: "Reparación aire acondicionado", categoria: "Mantenimiento", proveedor: "Clima Total", comprobante: "FAC-000453", metodo: "Transferencia", importe: "$ 32.000,00" },
    { fecha: "25/05/2024", concepto: "Honorarios contador", categoria: "Honorarios", proveedor: "Estudio Contable SRL", comprobante: "FAC-000452", metodo: "Transferencia", importe: "$ 25.000,00" },
    { fecha: "24/05/2024", concepto: "Insumos de oficina", categoria: "Administración", proveedor: "Librería Norte", comprobante: "FAC-000448", metodo: "Efectivo", importe: "$ 6.500,00" },
    { fecha: "23/05/2024", concepto: "Mantenimiento ascensor", categoria: "Mantenimiento", proveedor: "Otis", comprobante: "FAC-000447", metodo: "Transferencia", importe: "$ 48.000,00" },
    { fecha: "22/05/2024", concepto: "Pago Aysa Mayo", categoria: "Servicios", proveedor: "Aysa", comprobante: "FAC-000446", metodo: "Transferencia", importe: "$ 15.200,00" },
    { fecha: "21/05/2024", concepto: "Seguro edificio", categoria: "Seguros", proveedor: "La Caja", comprobante: "FAC-000445", metodo: "Tarjeta", importe: "$ 85.000,00" },
    { fecha: "20/05/2024", concepto: "Gastos bancarios", categoria: "Bancos", proveedor: "Banco Nación", comprobante: "GA-000210", metodo: "Débito", importe: "$ 3.400,00" },
    { fecha: "18/05/2024", concepto: "Artículos de cafetería", categoria: "Administración", proveedor: "Supermercado Coto", comprobante: "FAC-000444", metodo: "Efectivo", importe: "$ 14.100,00" },
    { fecha: "17/05/2024", concepto: "Mantenimiento de jardín", categoria: "Mantenimiento", proveedor: "Paisajismo Verde", comprobante: "FAC-000443", metodo: "Transferencia", importe: "$ 22.000,00" },
    { fecha: "15/05/2024", concepto: "Compra de resmas de papel", categoria: "Administración", proveedor: "Papelera San Martín", comprobante: "FAC-000442", metodo: "Efectivo", importe: "$ 8.900,00" },
    { fecha: "14/05/2024", concepto: "Repuesto bomba de agua", categoria: "Mantenimiento", proveedor: "Sanitarios Central", comprobante: "FAC-000441", metodo: "Tarjeta", importe: "$ 37.600,00" },
    { fecha: "12/05/2024", concepto: "Servicio de Vigilancia", categoria: "Seguridad", proveedor: "SegurPlus S.A.", comprobante: "FAC-000440", metodo: "Transferencia", importe: "$ 120.000,00" },
    { fecha: "10/05/2024", concepto: "Servicio telefónico e internet", categoria: "Servicios", proveedor: "Telecom Argentina", comprobante: "FAC-000439", metodo: "Transferencia", importe: "$ 28.450,00" },
    { fecha: "08/05/2024", concepto: "Reparación portón garaje", categoria: "Mantenimiento", proveedor: "Portones Metálicos", comprobante: "FAC-000438", metodo: "Transferencia", importe: "$ 19.500,00" },
    { fecha: "06/05/2024", concepto: "Impresión de folletos socios", categoria: "Publicidad", proveedor: "Imprenta Rápida", comprobante: "FAC-000437", metodo: "Efectivo", importe: "$ 12.000,00" },
    { fecha: "05/05/2024", concepto: "Compra de sillas para salón", categoria: "Mantenimiento", proveedor: "Muebles Confort", comprobante: "FAC-000436", metodo: "Tarjeta", importe: "$ 64.000,00" },
    { fecha: "04/05/2024", concepto: "Abono sistema contable", categoria: "Servicios", proveedor: "Sistemas Software", comprobante: "FAC-000435", metodo: "Transferencia", importe: "$ 16.500,00" },
    { fecha: "03/05/2024", concepto: "Gastos de mensajería", categoria: "Administración", proveedor: "MotoEnvío", comprobante: "REC-009822", metodo: "Efectivo", importe: "$ 4.200,00" },
    { fecha: "02/05/2024", concepto: "Elementos de cerrajería", categoria: "Mantenimiento", proveedor: "Cerrajería Almagro", comprobante: "FAC-000434", metodo: "Efectivo", importe: "$ 7.800,00" },
    { fecha: "02/05/2024", concepto: "Comisión cuenta corriente", categoria: "Bancos", proveedor: "Banco Nación", comprobante: "GA-000209", metodo: "Débito", importe: "$ 2.900,00" },
    { fecha: "01/05/2024", concepto: "Servicio de limpieza mensual", categoria: "Mantenimiento", proveedor: "Limpieza Brillo", comprobante: "FAC-000433", metodo: "Transferencia", importe: "$ 90.000,00" },
    { fecha: "01/05/2024", concepto: "Renovación dominio web", categoria: "Administración", proveedor: "NIC Argentina", comprobante: "FAC-000432", metodo: "Tarjeta", importe: "$ 5.400,00" }
  ];

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const totalItems = expenses.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  // Adjust page if current page exceeds total pages after rows per page changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [rowsPerPage, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedExpenses = expenses.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="treasury-container">
      {/* Header row with "New" button */}
      <div className="treasury-header-row">
        <div style={{visibility: 'hidden'}}>spacer</div>
        <button className="header-btn">
          <Plus size={18} />
          Nuevo Egreso
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input type="text" className="search-input" placeholder="Buscar por concepto, proveedor, comprobante..." />
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
            <option>Todos los proveedores</option>
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
                <th>Proveedor</th>
                <th>Comprobante</th>
                <th>Método de Pago</th>
                <th style={{textAlign: 'right'}}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {paginatedExpenses.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.fecha}</td>
                  <td>{item.concepto}</td>
                  <td>{item.categoria}</td>
                  <td>{item.proveedor}</td>
                  <td>{item.comprobante}</td>
                  <td>{item.metodo}</td>
                  <td className="amount-egreso" style={{textAlign: 'right'}}>{item.importe}</td>
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
          itemLabel="egresos"
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

export default Expenses;
