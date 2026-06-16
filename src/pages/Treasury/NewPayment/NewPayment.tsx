import React from "react";
import { 
  Search, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  Save, 
  Info,
  User,
  History,
  FileSearch,
  PlusCircle,
  Trash2
} from "lucide-react";
import "./NewPayment.css";

const NewPayment: React.FC = () => {
  return (
    <div className="new-payment-container">
      <div className="new-payment-layout">
        {/* Columna Izquierda: Formulario */}
        <div className="new-payment-form-section">
          <div className="card-custom">
            <h3 className="card-title">Datos del Pago</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Tipo de Ingreso <span className="required">*</span></label>
                <select className="form-control">
                  <option>Cuota Social</option>
                  <option>Donación</option>
                  <option>Otros</option>
                </select>
              </div>

              <div className="form-group">
                <label>Fecha del Pago <span className="required">*</span></label>
                <div className="input-with-icon">
                  <input type="text" className="form-control" defaultValue="19/05/2024" />
                  <Calendar size={18} className="input-icon" />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Socio <span className="required">*</span></label>
                <div className="input-with-icon">
                  <input type="text" className="form-control" placeholder="Buscar socio por nombre o DNI..." />
                  <Search size={18} className="input-icon" />
                </div>
                
                {/* Resultado de búsqueda seleccionado (Mock) */}
                <div className="selected-user-card">
                  <div className="user-info">
                    <div className="user-avatar-small">
                      <User size={20} />
                    </div>
                    <div className="user-details">
                      <span className="user-name">Juan Carlos Rodriguez</span>
                      <span className="user-dni">DNI 12.345.678</span>
                    </div>
                  </div>
                  <div className="user-status">
                    <span className="user-number">Nº Socio 2456</span>
                    <CheckCircle size={18} className="status-icon" />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Período / Concepto <span className="required">*</span></label>
                <select className="form-control">
                  <option>Mayo 2024</option>
                  <option>Junio 2024</option>
                </select>
              </div>

              <div className="form-group">
                <label>Importe <span className="required">*</span></label>
                <div className="input-with-icon">
                  <input type="text" className="form-control" defaultValue="15.000,00" />
                  <DollarSign size={18} className="input-icon" />
                </div>
              </div>

              <div className="form-group">
                <label>Forma de Pago <span className="required">*</span></label>
                <select className="form-control">
                  <option>Transferencia Bancaria</option>
                  <option>Efectivo</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Cuenta de Origen</label>
                <select className="form-control">
                  <option>Banco Nación - Cta. Cte. Nº 123456789</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Descripción / Observaciones</label>
                <textarea 
                  className="form-control text-area" 
                  placeholder="Pago de cuota social correspondiente al mes de mayo 2024."
                  rows={3}
                ></textarea>
                <span className="char-counter">62/200</span>
              </div>

              <div className="form-group full-width">
                <label>Comprobante</label>
                <div className="file-upload-area">
                  <div className="upload-placeholder">
                    <FileText size={32} />
                    <p>Arrastrar archivo aquí o <span className="link">seleccionar</span></p>
                    <span className="file-info">Formatos permitidos: JPG, PNG, PDF (Máx. 5MB)</span>
                  </div>
                  
                  {/* Archivo cargado (Mock) */}
                  <div className="uploaded-file">
                    <div className="file-icon-pdf">PDF</div>
                    <div className="file-meta">
                      <span className="file-name">comprobante_19052024.pdf</span>
                      <span className="file-size">234 KB</span>
                    </div>
                    <button className="remove-file"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-cancel">Cancelar</button>
              <button className="btn-save">
                <Save size={18} />
                Guardar Pago
              </button>
            </div>

            <div className="info-alert">
              <Info size={18} />
              <p>Los pagos registrados se reflejarán automáticamente en el saldo disponible y en los reportes de tesorería.</p>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Resumen e Información */}
        <div className="new-payment-sidebar-section">
          {/* Resumen del Pago */}
          <div className="card-custom summary-card">
            <h3 className="card-title">Resumen del Pago</h3>
            <div className="summary-list">
              <div className="summary-item">
                <div className="summary-label">
                  <User size={16} /> <span>Tipo de Ingreso</span>
                </div>
                <div className="summary-value">Cuota Social</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <User size={16} /> <span>Socio</span>
                </div>
                <div className="summary-value">Juan Carlos Rodriguez</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <Calendar size={16} /> <span>Período</span>
                </div>
                <div className="summary-value">Mayo 2024</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <DollarSign size={16} /> <span>Importe</span>
                </div>
                <div className="summary-value highlight-green">$ 15.000,00</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <CreditCard size={16} /> <span>Forma de Pago</span>
                </div>
                <div className="summary-value">Transferencia Bancaria</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <FileText size={16} /> <span>Cuenta de Origen</span>
                </div>
                <div className="summary-value">Banco Nación - Cta. Cte.</div>
              </div>
            </div>
            
            <div className="summary-total">
              <span>Total a Registrar</span>
              <span className="total-amount">$ 15.000,00</span>
            </div>
          </div>

          {/* Información del Socio */}
          <div className="card-custom socio-info-card">
            <h3 className="card-title">Información del Socio</h3>
            <div className="socio-profile">
              <div className="socio-avatar">
                <User size={32} />
              </div>
              <div className="socio-meta">
                <span className="socio-name">Juan Carlos Rodriguez</span>
                <span className="socio-sub">Nº Socio: 2456</span>
                <span className="socio-sub">DNI: 12.345.678</span>
              </div>
            </div>
            <div className="socio-contact">
              <div className="contact-item">
                 <CreditCard size={16} /> <span>11 2345 6789</span>
              </div>
              <div className="contact-item">
                 <FileText size={16} /> <span>juancarlos.rodriguez@email.com</span>
              </div>
              <div className="contact-item">
                 <PlusCircle size={16} /> <span>Av. Libertador 1234, CABA</span>
              </div>
            </div>
          </div>

          {/* Detalles Socio*/}
          <div className="card-custom">
            <h3 className="card-title">Detalle Socio</h3>
            <div className="quick-grid">
              <button className="quick-btn">
                <div className="quick-icon-wrap"><History size={20} /></div>
                <span>Historial del Socio</span>
              </button>
              <button className="quick-btn">
                <div className="quick-icon-wrap"><FileSearch size={20} /></div>
                <span>Ficha del Socio</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPayment;
