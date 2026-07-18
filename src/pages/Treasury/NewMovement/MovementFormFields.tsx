import React from "react";
import { CreditCard } from "lucide-react";
import PersonSearch from "../../../components/person/PersonSearch";
import type { Member, Person } from "../../../models/members";
import type { ServiceItem } from "../../../services/servicesApi";

interface MovementFormFieldsProps {
  cajaOrigen: "caja_chica" | "banco";
  onCajaOrigenChange: (v: "caja_chica" | "banco") => void;
  personType: "socio" | "persona";
  onPersonTypeChange: (v: "socio" | "persona") => void;
  concept: string;
  onConceptChange: (v: string) => void;
  concepts: string[];
  servicio: string;
  onServicioChange: (v: string) => void;
  serviciosFromApi: ServiceItem[];
  showServicioSelect: boolean;
  onOpenNewService: () => void;
  memberSearch: string;
  onMemberSearchChange: (v: string) => void;
  memberResults: (Member | Person)[];
  selectedMember: Member | null;
  onSelectMember: (m: Member | Person) => void;
  onClearMember: () => void;
  showMemberDropdown: boolean;
  onShowMemberDropdown: (v: boolean) => void;
  membersLoading: boolean;
  personSearch: string;
  onPersonSearchChange: (v: string) => void;
  personResults: (Member | Person)[];
  selectedPerson: Person | null;
  onSelectPerson: (p: Member | Person) => void;
  onClearPerson: () => void;
  showPersonDropdown: boolean;
  onShowPersonDropdown: (v: boolean) => void;
  personsLoading: boolean;
  touched: Record<string, boolean>;
  errors: Record<string, string | undefined>;
  onTouchField: (field: string) => void;
}

const MovementFormFields: React.FC<MovementFormFieldsProps> = ({
  cajaOrigen,
  onCajaOrigenChange,
  personType,
  onPersonTypeChange,
  concept,
  onConceptChange,
  concepts,
  servicio,
  onServicioChange,
  serviciosFromApi,
  showServicioSelect,
  onOpenNewService,
  memberSearch,
  onMemberSearchChange,
  memberResults,
  selectedMember,
  onSelectMember,
  onClearMember,
  showMemberDropdown,
  onShowMemberDropdown,
  membersLoading,
  personSearch,
  onPersonSearchChange,
  personResults,
  selectedPerson,
  onSelectPerson,
  onClearPerson,
  showPersonDropdown,
  onShowPersonDropdown,
  personsLoading,
  touched,
  errors,
  onTouchField,
}) => {
  const formaPagoLabel = cajaOrigen === "caja_chica" ? "Efectivo" : "Transferencia";

  return (
    <>
      <div className="form-grid">
        <div className="form-group">
          <label>
            Origen del Movimiento <span className="required">*</span>
          </label>
          <select
            className="form-control"
            value={cajaOrigen}
            onChange={(e) => onCajaOrigenChange(e.target.value as "caja_chica" | "banco")}
          >
            <option value="caja_chica">Caja Chica</option>
            <option value="banco">Banco</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            Forma de Pago <span className="required">*</span>
          </label>
          <div className="input-with-icon">
            <input type="text" className="form-control" value={formaPagoLabel} readOnly />
            <CreditCard size={18} className="input-icon" />
          </div>
        </div>

        <div className="form-group">
          <label>
            Quien realiza el pago <span className="required">*</span>
          </label>
          <select
            className="form-control"
            value={personType}
            onChange={(e) => onPersonTypeChange(e.target.value as "socio" | "persona")}
          >
            <option value="socio">Socio</option>
            <option value="persona">Persona</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            Concepto <span className="required">*</span>
          </label>
          <select
            className="form-control"
            value={concept}
            onChange={(e) => onConceptChange(e.target.value)}
          >
            {concepts.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {showServicioSelect && (
          <div className="form-group full-width">
            <label>
              Servicio <span className="required">*</span>
            </label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                className="form-control"
                value={servicio}
                onChange={(e) => onServicioChange(e.target.value)}
                style={{ flex: 1 }}
              >
                {serviciosFromApi.length === 0 ? (
                  <option value="">No hay servicios disponibles</option>
                ) : (
                  serviciosFromApi.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))
                )}
              </select>
              <button
                type="button"
                className="add-service-btn"
                onClick={onOpenNewService}
                title="Agregar nuevo servicio"
              >
                +
              </button>
            </div>
          </div>
        )}

        <div className="form-group full-width">
          <label>
            {personType === "socio" ? "Socio" : "Persona"} <span className="required">*</span>
          </label>

          {personType === "socio" ? (
            <PersonSearch
              type="socio"
              searchValue={memberSearch}
              onSearchChange={onMemberSearchChange}
              results={memberResults}
              selected={selectedMember}
              onSelect={onSelectMember}
              onClear={onClearMember}
              showDropdown={showMemberDropdown}
              onShowDropdown={onShowMemberDropdown}
              loading={membersLoading}
              error={errors.socio}
              touched={touched.socio}
              onBlur={() => { if (!selectedMember) onTouchField("socio"); }}
            />
          ) : (
            <PersonSearch
              type="persona"
              searchValue={personSearch}
              onSearchChange={onPersonSearchChange}
              results={personResults}
              selected={selectedPerson}
              onSelect={onSelectPerson}
              onClear={onClearPerson}
              showDropdown={showPersonDropdown}
              onShowDropdown={onShowPersonDropdown}
              loading={personsLoading}
              error={errors.persona}
              touched={touched.persona}
              onBlur={() => { if (!selectedPerson) onTouchField("persona"); }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default MovementFormFields;
