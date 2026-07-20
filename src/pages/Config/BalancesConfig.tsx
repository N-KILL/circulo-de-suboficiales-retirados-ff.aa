import React, { useState } from "react";
import { Save, Loader } from "lucide-react";
import { saveInitialBalances } from "../../services/initialBalancesApi";
import { parseMoney } from "../../utils/format";

interface BalancesConfigProps {
  initialCajaChica: string;
  initialBanco: string;
}

const BalancesConfig: React.FC<BalancesConfigProps> = ({ initialCajaChica, initialBanco }) => {
  const [cajaChica, setCajaChica] = useState(initialCajaChica);
  const [banco, setBanco] = useState(initialBanco);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const cc = parseMoney(cajaChica);
      const bk = parseMoney(banco);
      if (isNaN(cc) || isNaN(bk)) throw new Error("Ingresá valores numéricos válidos");
      await saveInitialBalances(cc, bk);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="config-form">
      <div className="config-field">
        <label>Caja Chica (efectivo)</label>
        <input type="text" className="config-input" value={cajaChica} onChange={(e) => setCajaChica(e.target.value)} placeholder="0.00" />
      </div>
      <div className="config-field">
        <label>Banco (transferencias)</label>
        <input type="text" className="config-input" value={banco} onChange={(e) => setBanco(e.target.value)} placeholder="0.00" />
      </div>
      {error && <div className="config-error">{error}</div>}
      {success && <div className="config-success">Valores guardados correctamente</div>}
      <button type="submit" className="config-save-btn" disabled={saving}>
        {saving ? <><Loader size={16} className="spin" /> Guardando...</> : <><Save size={16} /> Guardar</>}
      </button>
    </form>
  );
};

export default BalancesConfig;
