import React from "react";
import { Printer, Download, X } from "lucide-react";
import { toCurrency, numberToWords, formatRecordDate } from "../../utils/format";
import logoUrl from "../../assets/logo_ffaa.png";
import "./Comprobante.css";

export interface ComprobanteData {
  receipt_number: number;
  type: "ingreso" | "egreso";
  date: string;
  detail: string;
  amount: number;
  origin: string;
  payerName?: string;
  conceptDetail?: string;
  copies_to_print: number;
  paymentMethod?: string;
}

interface ComprobanteProps {
  data: ComprobanteData;
  onClose: () => void;
}

const COPY_LABELS: Record<number, string> = {
  1: "ORIGINAL",
  2: "DUPLICADO",
  3: "TRIPLICADO",
};

function buildSingleReceiptHtml(data: ComprobanteData, copyLabel: string): string {
  const tipoRecibo = data.type === "ingreso" ? "RECIBO" : "COMPROBANTE DE EGRESO";
  const labelEntrega = data.type === "ingreso" ? "Recibí de" : "Pagué a";
  const formattedDate = formatRecordDate(data.date);

  return `
    <div class="receipt-page">
      ${copyLabel ? `<div class="copy-label">${copyLabel}</div>` : ""}
      <div class="receipt-header">
        <div class="header-row-1">
          <div class="header-logo">
            <img src="${logoUrl}" alt="Logo" />
          </div>
          <div class="header-text">
            <div class="institution-name">Círculo de Suboficiales Retirados de las Fuerzas Armadas de la Nación</div>
            <div class="motto">"Honor y Patria"</div>
          </div>
          <div class="header-spacer"></div>
        </div>
        <div class="header-row-2">
          <div class="header-col">Dean Funes 536</div>
          <div class="header-col header-col-center">TEL: 0358-4624743</div>
          <div class="header-col">5800 Río Cuarto (CBA)</div>
        </div>
      </div>

      <div class="receipt-title">${tipoRecibo} AUTORIZADO N° ${String(data.receipt_number).padStart(6, "0")}, del día ${formattedDate}</div>

      <div class="receipt-body">
        <div class="field">
          <span class="field-label">${labelEntrega}:</span>
          <div class="field-value underline">${data.payerName || "—"}</div>
        </div>
        <div class="field">
          <span class="field-label">La cantidad de pesos:</span>
          <div class="field-value amount-words">${numberToWords(data.amount).toUpperCase()}</div>
        </div>
        ${data.paymentMethod ? `<div class="field"><span class="field-label">Forma de pago:</span> <span class="field-value">${data.paymentMethod}</span></div>` : ""}
      </div>

      <div class="receipt-concept">
        <span class="concept-label">En concepto de:</span>
        <div class="field-value">${data.conceptDetail || data.detail || "—"}</div>
      </div>

      <div class="receipt-footer">
        <div class="footer-amount">$ ${new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data.amount)}</div>
        <div class="footer-signature">
          <div class="sig-line">Firma</div>
          <div class="acl-line">Aclaración: <span></span></div>
        </div>
      </div>
    </div>
  `;
}

function buildPrintHtml(data: ComprobanteData, overrideLabel?: string): string {
  const copies = overrideLabel ? 1 : Math.max(1, Math.min(3, data.copies_to_print));
  const pages: string[] = [];

  for (let i = 0; i < copies; i++) {
    pages.push(buildSingleReceiptHtml(data, overrideLabel ?? COPY_LABELS[i + 1] ?? ""));
  }

  const isMulti = copies > 1;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page {
          size: A4;
          margin: 10mm;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          color: #333;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .receipt-page {
          padding: ${isMulti ? "10px 16px" : "20px"};
          ${isMulti ? "" : "page-break-after: always;"}
          position: relative;
          display: flex;
          flex-direction: column;
          ${isMulti ? "border-bottom: 2px dashed #aaa;" : ""}
          overflow: hidden;
        }
        ${isMulti ? "" : ".receipt-page:last-child { page-break-after: auto; }"}
        ${isMulti ? ".receipt-page:last-child { border-bottom: none; }" : ""}

        .copy-label {
          text-align: center;
          font-size: ${isMulti ? "9px" : "12px"};
          font-weight: 700;
          color: #999;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: ${isMulti ? "4px" : "12px"};
          padding: 2px 0;
          border-bottom: 1px dashed #ccc;
        }

        .receipt-header {
          margin-bottom: ${isMulti ? "6px" : "20px"};
          padding-bottom: ${isMulti ? "6px" : "16px"};
          border-bottom: 2px solid #1a3a5c;
        }
        .header-row-1 {
          display: grid;
          grid-template-columns: ${isMulti ? "50px 1fr 50px" : "80px 1fr 80px"};
          align-items: center;
          gap: ${isMulti ? "6px" : "12px"};
          margin-bottom: ${isMulti ? "2px" : "8px"};
        }
        .header-logo { text-align: center; }
        .header-logo img { width: ${isMulti ? "40px" : "70px"}; height: auto; }
        .header-text { text-align: center; }
        .header-text .institution-name {
          font-size: ${isMulti ? "9px" : "14px"};
          font-weight: 700;
          color: #1a3a5c;
          line-height: 1.3;
          white-space: nowrap;
        }
        .header-text .motto {
          font-size: ${isMulti ? "9px" : "15px"};
          font-weight: 700;
          color: #1a3a5c;
          margin-top: ${isMulti ? "0px" : "4px"};
        }
        .header-spacer { }
        .header-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          align-items: center;
          text-align: center;
          font-size: ${isMulti ? "7px" : "10px"};
          color: #555;
          margin-top: ${isMulti ? "2px" : "8px"};
        }

        .receipt-title { text-align: center; font-size: ${isMulti ? "8px" : "14px"}; font-weight: 700; color: #1a3a5c; margin: ${isMulti ? "4px 0" : "16px 0"}; text-transform: uppercase; }

        .receipt-body { font-size: ${isMulti ? "8px" : "13px"}; line-height: ${isMulti ? "1.3" : "1.8"}; margin: ${isMulti ? "4px 0" : "20px 0"}; }
        .receipt-body .field { margin-bottom: ${isMulti ? "2px" : "10px"}; }
        .receipt-body .field-label { font-weight: 600; }
        .receipt-body .field-value { margin-top: 2px; }
        .receipt-body .underline { border-bottom: 1px solid #999; display: inline-block; min-width: 200px; }
        .receipt-body .amount-words { font-style: italic; margin-top: 4px; }

        .receipt-concept { margin: ${isMulti ? "4px 0" : "16px 0"}; font-size: ${isMulti ? "8px" : "13px"}; line-height: ${isMulti ? "1.2" : "1.6"}; }
        .receipt-concept .concept-label { font-weight: 600; }

        .receipt-footer { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; }
        .footer-amount { font-size: ${isMulti ? "9px" : "14px"}; font-weight: 700; color: #1a3a5c; }
        .footer-signature { text-align: center; min-width: ${isMulti ? "140px" : "240px"}; }
        .footer-signature .sig-line { border-top: 1px solid #333; margin-top: ${isMulti ? "10px" : "60px"}; padding-top: ${isMulti ? "2px" : "6px"}; font-size: ${isMulti ? "7px" : "12px"}; color: #555; }
        .footer-signature .acl-line { margin-top: ${isMulti ? "4px" : "20px"}; font-size: ${isMulti ? "7px" : "12px"}; color: #555; }
        .footer-signature .acl-line span { border-bottom: 1px solid #333; display: inline-block; min-width: ${isMulti ? "100px" : "180px"}; }
      </style>
    </head>
    <body>
      ${pages.join("")}
    </body>
    </html>
  `;
}

function handlePrint(data: ComprobanteData) {
  const num = String(data.receipt_number).padStart(6, "0");
  const fileName = `comprobante-${data.type}-N${num}`;
  const html = buildPrintHtml(data);
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.title = fileName;
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); }, 300);
}

function handleDownloadPdf(data: ComprobanteData) {
  const num = String(data.receipt_number).padStart(6, "0");
  const fileName = `comprobante-${data.type}-N${num}`;
  const html = buildPrintHtml(data);
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.title = fileName;
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    setTimeout(() => printWindow.close(), 500);
  }, 300);
}

function handlePrintCopy(data: ComprobanteData) {
  const num = String(data.receipt_number).padStart(6, "0");
  const fileName = `copia-comprobante-${data.type}-N${num}`;
  const html = buildPrintHtml(data, "COPIA");
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.title = fileName;
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    setTimeout(() => printWindow.close(), 500);
  }, 300);
}

const Comprobante: React.FC<ComprobanteProps> = ({ data, onClose }) => {
  const typeLabel = data.type === "ingreso" ? "INGRESO" : "EGRESO";
  const formattedDate = formatRecordDate(data.date);
  const labelEntrega = data.type === "ingreso" ? "Recibido de" : "Pagado a";

  return (
    <div className="comprobante-overlay">
      <div className="comprobante-modal" onClick={(e) => e.stopPropagation()}>
        <button className="comprobante-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="comprobante-content">
          <div className="comprobante-detail-card">
            <div className="comprobante-detail-row">
              <span className="comprobante-detail-label">Comprobante N°</span>
              <span className="comprobante-detail-value">{String(data.receipt_number).padStart(6, "0")}</span>
            </div>
            <div className="comprobante-detail-row">
              <span className="comprobante-detail-label">Tipo</span>
              <span className={`comprobante-type-badge ${data.type === "ingreso" ? "type-ingreso" : "type-egreso"}`}>{typeLabel}</span>
            </div>
            <div className="comprobante-detail-row">
              <span className="comprobante-detail-label">Fecha</span>
              <span className="comprobante-detail-value">{formattedDate}</span>
            </div>
            {data.payerName && (
              <div className="comprobante-detail-row">
                <span className="comprobante-detail-label">{labelEntrega}</span>
                <span className="comprobante-detail-value">{data.payerName}</span>
              </div>
            )}
            <div className="comprobante-detail-row">
              <span className="comprobante-detail-label">Detalle</span>
              <span className="comprobante-detail-value">{data.detail}</span>
            </div>
            <div className="comprobante-detail-row">
              <span className="comprobante-detail-label">Importe</span>
              <span className="comprobante-detail-value comprobante-amount-value">{toCurrency(data.amount)}</span>
            </div>
            {data.paymentMethod && (
              <div className="comprobante-detail-row">
                <span className="comprobante-detail-label">Forma de pago</span>
                <span className="comprobante-detail-value">{data.paymentMethod}</span>
              </div>
            )}
          </div>
        </div>

        <div className="comprobante-actions no-print">
          <button className="comprobante-print-btn" onClick={() => handlePrint(data)}>
            <Printer size={16} /> Imprimir
          </button>
          <button className="comprobante-print-btn comprobante-copy-btn" onClick={() => handlePrintCopy(data)}>
            <Printer size={16} /> Imprimir Copia
          </button>
          <button className="comprobante-download-btn" onClick={() => handleDownloadPdf(data)}>
            <Download size={16} /> Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default Comprobante;
