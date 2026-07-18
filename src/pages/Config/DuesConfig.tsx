import React, { useState } from "react";
import { Save, Loader } from "lucide-react";
import { saveDuesConfig } from "../../services/duesConfigApi";
import { parseMoney } from "../../utils/format";

interface DuesConfigProps {
  initialMemberFee: string;
  initialConsiderationYears: string;
  initialNichoMemberFee: string;
  initialNichoNonMemberFee: string;
  initialUrnaMemberFee: string;
  initialUrnaNonMemberFee: string;
  initialBolsaMemberFee: string;
  initialBolsaNonMemberFee: string;
  initialAsistencialFee: string;
  initialPlanSaludFee: string;
  initialFeeAct: string;
  initialFeeActA: string;
  initialFeeAdh: string;
  initialFeePart: string;
  initialFeeVit: string;
}

const SOCIO_TYPES = [
  { key: "feeAct", label: "Activo" },
  { key: "feeActA", label: "Activo A" },
  { key: "feeAdh", label: "Adherente" },
  { key: "feePart", label: "Participante" },
  { key: "feeVit", label: "Vitalicio" },
] as const;

const DuesConfig: React.FC<DuesConfigProps> = (props) => {
  const [memberFee] = useState(props.initialMemberFee);
  const [considerationYears, setConsiderationYears] = useState(props.initialConsiderationYears);
  const [nichoMemberFee, setNichoMemberFee] = useState(props.initialNichoMemberFee);
  const [nichoNonMemberFee, setNichoNonMemberFee] = useState(props.initialNichoNonMemberFee);
  const [urnaMemberFee, setUrnaMemberFee] = useState(props.initialUrnaMemberFee);
  const [urnaNonMemberFee, setUrnaNonMemberFee] = useState(props.initialUrnaNonMemberFee);
  const [bolsaMemberFee, setBolsaMemberFee] = useState(props.initialBolsaMemberFee);
  const [bolsaNonMemberFee, setBolsaNonMemberFee] = useState(props.initialBolsaNonMemberFee);
  const [asistencialFee, setAsistencialFee] = useState(props.initialAsistencialFee);
  const [planSaludFee, setPlanSaludFee] = useState(props.initialPlanSaludFee);
  const [feeAct, setFeeAct] = useState(props.initialFeeAct);
  const [feeActA, setFeeActA] = useState(props.initialFeeActA);
  const [feeAdh, setFeeAdh] = useState(props.initialFeeAdh);
  const [feePart, setFeePart] = useState(props.initialFeePart);
  const [feeVit, setFeeVit] = useState(props.initialFeeVit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const feeSetters: Record<string, React.Dispatch<React.SetStateAction<string>>> = {
    feeAct: setFeeAct,
    feeActA: setFeeActA,
    feeAdh: setFeeAdh,
    feePart: setFeePart,
    feeVit: setFeeVit,
  };
  const feeValues: Record<string, string> = {
    feeAct, feeActA, feeAdh, feePart, feeVit,
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const cuota = parseMoney(memberFee);
      const years = parseInt(considerationYears, 10) || 0;
      if (isNaN(cuota)) throw new Error("Ingresá valores numéricos válidos");
      await saveDuesConfig(
        cuota, years,
        parseMoney(nichoMemberFee), parseMoney(nichoNonMemberFee),
        parseMoney(urnaMemberFee), parseMoney(urnaNonMemberFee),
        parseMoney(bolsaMemberFee), parseMoney(bolsaNonMemberFee),
        parseMoney(asistencialFee), parseMoney(planSaludFee),
        parseMoney(feeAct), parseMoney(feeActA), parseMoney(feeAdh),
        parseMoney(feePart), parseMoney(feeVit),
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="config-card">
      <h3>Cuotas</h3>
      <p className="config-description">
        Establecé los valores por defecto para la cuota de socio y el costo de cementerio.
        Estos valores se cargarán automáticamente al crear un nuevo movimiento.
      </p>
      <form onSubmit={handleSave} className="config-form">

        <div className="config-cemetery-section">
          <label className="config-cemetery-title">Cuotas por Tipo de Socio</label>
          <p className="config-cemetery-subtitle">Definí el valor mensual base para cada tipo de socio.</p>
          <div className="config-cemetery-table">
            <div className="config-cemetery-header">
              <div className="config-cemetery-cell config-cemetery-label">Tipo</div>
              <div className="config-cemetery-cell config-cemetery-col-header">Valor Mensual</div>
            </div>
            {SOCIO_TYPES.map((row) => (
              <div key={row.key} className="config-cemetery-row">
                <div className="config-cemetery-cell config-cemetery-row-label">{row.label}</div>
                <div className="config-cemetery-cell">
                  <input
                    type="text"
                    className="config-input"
                    value={feeValues[row.key]}
                    onChange={(e) => feeSetters[row.key](e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="config-cemetery-section">
          <label className="config-cemetery-title">Recargos por Servicios</label>
          <p className="config-cemetery-subtitle">Valores adicionales que se suman a la cuota base según correspondan al socio.</p>
          <div className="config-cemetery-table">
            <div className="config-cemetery-header">
              <div className="config-cemetery-cell config-cemetery-label">Concepto</div>
              <div className="config-cemetery-cell config-cemetery-col-header">Valor Mensual</div>
            </div>
            <div className="config-cemetery-row">
              <div className="config-cemetery-cell config-cemetery-row-label">Asistencial</div>
              <div className="config-cemetery-cell">
                <input type="text" className="config-input" value={asistencialFee} onChange={(e) => setAsistencialFee(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="config-cemetery-row">
              <div className="config-cemetery-cell config-cemetery-row-label">Plan Salud</div>
              <div className="config-cemetery-cell">
                <input type="text" className="config-input" value={planSaludFee} onChange={(e) => setPlanSaludFee(e.target.value)} placeholder="0.00" />
              </div>
            </div>
          </div>
        </div>

        <div className="config-field">
          <label>Años de consideración</label>
          <input type="number" className="config-input" value={considerationYears} onChange={(e) => setConsiderationYears(e.target.value)} min={0} max={9} step={1} placeholder="0" />
        </div>

        <div className="config-cemetery-section">
          <label className="config-cemetery-title">Cuotas de Cementerio</label>
          <p className="config-cemetery-subtitle">Definí el valor mensual para cada tipo de sepultura, distinguiendo socios y no socios.</p>
          <div className="config-cemetery-table">
            <div className="config-cemetery-header">
              <div className="config-cemetery-cell config-cemetery-label"></div>
              <div className="config-cemetery-cell config-cemetery-col-header">Socios</div>
              <div className="config-cemetery-cell config-cemetery-col-header">No Socios</div>
            </div>
            {[
              { label: "Nicho", memberVal: nichoMemberFee, nonMemberVal: nichoNonMemberFee, memberSet: setNichoMemberFee, nonMemberSet: setNichoNonMemberFee },
              { label: "Urna", memberVal: urnaMemberFee, nonMemberVal: urnaNonMemberFee, memberSet: setUrnaMemberFee, nonMemberSet: setUrnaNonMemberFee },
              { label: "Bolsa", memberVal: bolsaMemberFee, nonMemberVal: bolsaNonMemberFee, memberSet: setBolsaMemberFee, nonMemberSet: setBolsaNonMemberFee },
            ].map((row) => (
              <div key={row.label} className="config-cemetery-row">
                <div className="config-cemetery-cell config-cemetery-row-label">{row.label}</div>
                <div className="config-cemetery-cell">
                  <input type="text" className="config-input" value={row.memberVal} onChange={(e) => row.memberSet(e.target.value)} placeholder="0.00" />
                </div>
                <div className="config-cemetery-cell">
                  <input type="text" className="config-input" value={row.nonMemberVal} onChange={(e) => row.nonMemberSet(e.target.value)} placeholder="0.00" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="config-error">{error}</div>}
        {success && <div className="config-success">Valores guardados correctamente</div>}
        <button type="submit" className="config-save-btn" disabled={saving}>
          {saving ? <><Loader size={16} className="spin" /> Guardando...</> : <><Save size={16} /> Guardar</>}
        </button>
      </form>
    </div>
  );
};

export default DuesConfig;
