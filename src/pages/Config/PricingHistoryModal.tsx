import React from "react";
import Modal from "../../components/ui/Modal";
import { toCurrency } from "../../utils/format";
import type { DuesConfig } from "../../services/duesConfigApi";

interface PricingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: DuesConfig[];
}

const FIELDS: { key: keyof DuesConfig; label: string }[] = [
  { key: "member_fee", label: "Cuota Base" },
  { key: "fee_act", label: "Activo" },
  { key: "fee_act_a", label: "Activo A" },
  { key: "fee_adh", label: "Adherente" },
  { key: "fee_part", label: "Participante" },
  { key: "fee_vit", label: "Vitalicio" },
  { key: "asistencial_fee", label: "Asistencial" },
  { key: "plan_salud_fee", label: "Plan Salud" },
  { key: "nicho_member_fee", label: "Nicho Socio" },
  { key: "nicho_non_member_fee", label: "Nicho No Socio" },
  { key: "urna_member_fee", label: "Urna Socio" },
  { key: "urna_non_member_fee", label: "Urna No Socio" },
  { key: "bolsa_member_fee", label: "Bolsa Socio" },
  { key: "bolsa_non_member_fee", label: "Bolsa No Socio" },
  { key: "consideration_years", label: "Años Consid." },
];

function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function isChanged(
  current: DuesConfig,
  previous: DuesConfig | undefined,
  key: keyof DuesConfig
): boolean {
  if (!previous) return false;
  return current[key] !== previous[key];
}

const PricingHistoryModal: React.FC<PricingHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Historial de Cuotas" maxWidth={1100}>
      <div className="pricing-history-wrapper">
        {history.length === 0 ? (
          <p className="pricing-history-empty">No hay registros anteriores.</p>
        ) : (
          <div className="pricing-history-scroll">
            <table className="pricing-history-table">
              <thead>
                <tr>
                  <th className="pricing-history-th pricing-history-th-date">Fecha</th>
                  {FIELDS.map((f) => (
                    <th key={f.key} className="pricing-history-th">{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row, idx) => {
                  const prev = history[idx + 1];
                  return (
                    <tr key={row.id}>
                      <td className="pricing-history-td pricing-history-td-date">
                        {formatDateTime(row.updated_at)}
                      </td>
                      {FIELDS.map((f) => {
                        const changed = isChanged(row, prev, f.key);
                        const val = row[f.key];
                        const display =
                          f.key === "consideration_years"
                            ? String(val)
                            : toCurrency(val as number);
                        return (
                          <td
                            key={f.key}
                            className={
                              "pricing-history-td" +
                              (changed ? " pricing-history-changed" : "")
                            }
                          >
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PricingHistoryModal;
