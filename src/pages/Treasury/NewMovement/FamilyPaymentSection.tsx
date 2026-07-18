import React from "react";
import type { Member } from "../../../models/members";

interface FamilyPaymentSectionProps {
  familyPayment: boolean;
  onFamilyPaymentChange: (v: boolean) => void;
  familyMembers: Member[];
  selectedFamilyMembers: Set<string>;
  onToggleFamilyMember: (id: string) => void;
  selectedMemberId: string;
  getMemberFee: (member: Member) => number;
}

const FamilyPaymentSection: React.FC<FamilyPaymentSectionProps> = ({
  familyPayment,
  onFamilyPaymentChange,
  familyMembers,
  selectedFamilyMembers,
  onToggleFamilyMember,
  selectedMemberId,
  getMemberFee,
}) => {
  return (
    <div className="family-payment-section">
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={familyPayment}
          onChange={(e) => onFamilyPaymentChange(e.target.checked)}
        />
        Pago por grupo familiar
      </label>
      {familyPayment && familyMembers.length > 0 && (
        <div className="family-member-list">
          <p className="family-member-hint">Seleccioná los miembros del grupo familiar a pagar:</p>
          {familyMembers.map((fm) => {
            const isPayer = fm.id === selectedMemberId;
            const isSelected = selectedFamilyMembers.has(fm.id);
            const memberFee = getMemberFee(fm);
            const paysByHaberes = (fm.pagaPor || "").toUpperCase() !== "TES";
            const isDisabled = paysByHaberes && !isPayer;
            return (
              <label key={fm.id} className={`family-member-item${isPayer ? " family-member-payer" : ""}${isDisabled ? " family-member-disabled" : ""}`}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => onToggleFamilyMember(fm.id)}
                />
                <span className="family-member-name">{fm.nombre}</span>
                <span className="family-member-socio">Nº {fm.numeroDeSocio}</span>
                <span className="family-member-tags">
                  <span className="family-tag tag-tipo">{fm.tipoSocio || "—"}</span>
                  {fm.asistencial && <span className="family-tag tag-asistencial">ASIST</span>}
                  {fm.planSalud && <span className="family-tag tag-plan-salud">SALUD</span>}
                  {paysByHaberes && <span className="family-tag tag-haberes">HABERES</span>}
                </span>
                <span className="family-member-fee">{memberFee > 0 ? `$ ${memberFee.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "—"}</span>
                {isPayer && <span className="family-member-badge">Paga</span>}
              </label>
            );
          })}
          <div className="family-member-total">
            <span>Total seleccionados:</span>
            <strong>
              $ {familyMembers
                .filter((fm) => selectedFamilyMembers.has(fm.id))
                .reduce((sum, fm) => sum + getMemberFee(fm), 0)
                .toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      )}
      {familyPayment && familyMembers.length === 0 && (
        <p className="family-member-hint">No se encontraron miembros del grupo familiar.</p>
      )}
    </div>
  );
};

export default FamilyPaymentSection;
