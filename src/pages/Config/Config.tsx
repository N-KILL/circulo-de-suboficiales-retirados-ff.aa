import React, { useEffect, useState } from "react";
import { Save, Loader } from "lucide-react";
import {
    fetchInitialBalances,
    saveInitialBalances,
} from "../../services/initialBalancesApi";
import "./Config.css";

const Config: React.FC = () => {
    const [cajaChica, setCajaChica] = useState("");
    const [banco, setBanco] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetchInitialBalances()
            .then((data) => {
                if (data) {
                    setCajaChica(data.caja_chica.toString());
                    setBanco(data.banco.toString());
                } else {
                    setCajaChica("0");
                    setBanco("0");
                }
            })
            .catch((err) => {
                setError(err.message || "Error al cargar valores iniciales");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const cc = parseFloat(cajaChica.replace(/\./g, "").replace(",", "."));
            const bk = parseFloat(banco.replace(/\./g, "").replace(",", "."));
            if (isNaN(cc) || isNaN(bk)) {
                throw new Error("Ingresá valores numéricos válidos");
            }
            await saveInitialBalances(cc, bk);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="dashboard-loading">Cargando...</div>;
    }

    return (
        <div className="config-container">
            <div className="treasury-header-row">
                <h2>Configuración</h2>
            </div>

            <div className="config-card">
                <h3>Valores Iniciales</h3>
                <p className="config-description">
                    Establecé los saldos iniciales de cada caja. Estos valores se usan
                    para calcular los saldos acumulados desde el inicio de los movimientos (2025).
                </p>

                <form onSubmit={handleSave} className="config-form">
                    <div className="config-field">
                        <label>Caja Chica (efectivo)</label>
                        <input
                            type="text"
                            className="config-input"
                            value={cajaChica}
                            onChange={(e) => setCajaChica(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="config-field">
                        <label>Banco (transferencias)</label>
                        <input
                            type="text"
                            className="config-input"
                            value={banco}
                            onChange={(e) => setBanco(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>

                    {error && <div className="config-error">{error}</div>}
                    {success && <div className="config-success">Valores guardados correctamente</div>}

                    <button type="submit" className="config-save-btn" disabled={saving}>
                        {saving ? (
                            <><Loader size={16} className="spin" /> Guardando...</>
                        ) : (
                            <><Save size={16} /> Guardar</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Config;
