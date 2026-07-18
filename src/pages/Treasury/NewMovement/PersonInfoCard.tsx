import React from "react";
import { User, Phone, Mail, MapPin, AlertTriangle, ExternalLink } from "lucide-react";
import type { Member, Person } from "../../../models/members";

interface PersonInfoCardProps {
  personType: "socio" | "persona";
  selectedMember: Member | null;
  selectedPerson: Person | null;
  debtLoading: boolean;
  monthsOwed: number | null;
  lastPaidFormatted: string;
}

const PersonInfoCard: React.FC<PersonInfoCardProps> = ({
  personType,
  selectedMember,
  selectedPerson,
  debtLoading,
  monthsOwed,
  lastPaidFormatted,
}) => {
  if (personType === "socio" && selectedMember) {
    const canCalculate = monthsOwed !== null;
    const showWarning = canCalculate && monthsOwed! > 0;

    return (
      <div className="card-custom socio-info-card">
        <h3 className="card-title">Información del Socio</h3>
        <div className="socio-profile">
          <div className="socio-avatar">
            <User size={32} />
          </div>
          <div className="socio-meta">
            <span className="socio-name">{selectedMember.nombre}</span>
            <span className="socio-sub">Nº Socio: {selectedMember.numeroDeSocio}</span>
            <span className="socio-sub">DNI: {selectedMember.documento}</span>
            {selectedMember.nroFamilia && (
              <span className="socio-sub" style={{ fontWeight: 600, color: "var(--azul-institucional)" }}>
                Grupo Familiar: {selectedMember.nroFamilia.split("/")[0]}
              </span>
            )}
          </div>
        </div>
        <div className="socio-contact">
          <div className="contact-item">
            <Phone size={16} /> <span>{selectedMember.telefono || "\u2014"}</span>
          </div>
          <div className="contact-item">
            <Mail size={16} /> <span>{selectedMember.email || "\u2014"}</span>
          </div>
          <div className="contact-item">
            <MapPin size={16} /> <span>{selectedMember.domicilio || "\u2014"}</span>
          </div>
          <div className="contact-item">
            <AlertTriangle size={16} /> <span>Estado deuda</span>
          </div>
        </div>

        {!debtLoading && (
          <div className={`debt-alert${showWarning ? " debt-alert-warning" : " debt-alert-ok"}`}>
            <div className="debt-alert-header">
              <AlertTriangle size={16} />
              <span>
                {canCalculate
                  ? monthsOwed! > 0
                    ? `Debe ${monthsOwed} ${monthsOwed === 1 ? "mes" : "meses"}`
                    : `Al día (último pago: ${lastPaidFormatted})`
                  : lastPaidFormatted
                    ? `Último pago: ${lastPaidFormatted}`
                    : "No disp."
                }
              </span>
            </div>
            <a
              href={`/socios/detalle/${selectedMember.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="debt-detail-btn"
            >
              Ver detalles
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>
    );
  }

  if (personType === "persona" && selectedPerson) {
    return (
      <div className="card-custom socio-info-card">
        <h3 className="card-title">Información de la Persona</h3>
        <div className="socio-profile">
          <div className="socio-avatar">
            <User size={32} />
          </div>
          <div className="socio-meta">
            <span className="socio-name">{selectedPerson.nombre}</span>
            <span className="socio-sub">{selectedPerson.tipoDoc}: {selectedPerson.documento}</span>
          </div>
        </div>
        <div className="socio-contact">
          <div className="contact-item">
            <Phone size={16} /> <span>{selectedPerson.telefono || "\u2014"}</span>
          </div>
          <div className="contact-item">
            <MapPin size={16} /> <span>{selectedPerson.domicilio || "\u2014"}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PersonInfoCard;
