import React, { useEffect, useState } from "react";
import { Save, Loader, Plus, Trash2, Pencil, X } from "lucide-react";
import {
    fetchInitialBalances,
    saveInitialBalances,
} from "../../services/initialBalancesApi";
import {
    fetchDuesConfig,
    saveDuesConfig,
} from "../../services/duesConfigApi";
import {
    fetchServices,
    saveService,
    updateService,
    deleteService,
} from "../../services/servicesApi";
import type { ServiceItem } from "../../services/servicesApi";
import "./Config.css";

const Config: React.FC = () => {
    const [cajaChica, setCajaChica] = useState("");
    const [banco, setBanco] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [memberFee, setMemberFee] = useState("");
    const [considerationYears, setConsiderationYears] = useState("");
    const [nichoMemberFee, setNichoMemberFee] = useState("");
    const [nichoNonMemberFee, setNichoNonMemberFee] = useState("");
    const [urnaMemberFee, setUrnaMemberFee] = useState("");
    const [urnaNonMemberFee, setUrnaNonMemberFee] = useState("");
    const [bolsaMemberFee, setBolsaMemberFee] = useState("");
    const [bolsaNonMemberFee, setBolsaNonMemberFee] = useState("");
    const [savingDues, setSavingDues] = useState(false);
    const [duesSuccess, setDuesSuccess] = useState(false);
    const [duesError, setDuesError] = useState<string | null>(null);

    const [services, setServices] = useState<ServiceItem[]>([]);
    const [svcName, setSvcName] = useState("");
    const [svcAmount, setSvcAmount] = useState("");
    const [savingService, setSavingService] = useState(false);
    const [servicesError, setServicesError] = useState<string | null>(null);
    const [editServiceId, setEditServiceId] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetchInitialBalances(),
            fetchDuesConfig(),
            fetchServices(),
        ])
            .then(([balances, duesCfg, svcs]) => {
                if (balances) {
                    setCajaChica(balances.caja_chica.toString());
                    setBanco(balances.banco.toString());
                } else {
                    setCajaChica("0");
                    setBanco("0");
                }
                if (duesCfg) {
                    setMemberFee(duesCfg.member_fee.toString());
                    setConsiderationYears(duesCfg.consideration_years.toString());
                    setNichoMemberFee(duesCfg.nicho_member_fee.toString());
                    setNichoNonMemberFee(duesCfg.nicho_non_member_fee.toString());
                    setUrnaMemberFee(duesCfg.urna_member_fee.toString());
                    setUrnaNonMemberFee(duesCfg.urna_non_member_fee.toString());
                    setBolsaMemberFee(duesCfg.bolsa_member_fee.toString());
                    setBolsaNonMemberFee(duesCfg.bolsa_non_member_fee.toString());
                } else {
                    setMemberFee("0");
                    setConsiderationYears("0");
                    setNichoMemberFee("0");
                    setNichoNonMemberFee("0");
                    setUrnaMemberFee("0");
                    setUrnaNonMemberFee("0");
                    setBolsaMemberFee("0");
                    setBolsaNonMemberFee("0");
                }
                setServices(svcs);
            })
            .catch((err) => {
                setError(err.message || "Error al cargar datos");
            })
            .finally(() => setLoading(false));
    }, []);

    const resetServiceForm = () => {
        setSvcName("");
        setSvcAmount("");
        setEditServiceId(null);
    };

    const parseMoney = (v: string) => parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0;

    const handleSaveBalances = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const cc = parseMoney(cajaChica);
            const bk = parseMoney(banco);
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

    const handleSaveDues = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingDues(true);
        setDuesError(null);
        setDuesSuccess(false);
        try {
            const cuota = parseMoney(memberFee);
            const years = parseInt(considerationYears, 10) || 0;
            if (isNaN(cuota)) {
                throw new Error("Ingresá valores numéricos válidos");
            }
            await saveDuesConfig(
                cuota, years,
                parseMoney(nichoMemberFee), parseMoney(nichoNonMemberFee),
                parseMoney(urnaMemberFee), parseMoney(urnaNonMemberFee),
                parseMoney(bolsaMemberFee), parseMoney(bolsaNonMemberFee),
            );
            setDuesSuccess(true);
            setTimeout(() => setDuesSuccess(false), 3000);
        } catch (err) {
            setDuesError(err instanceof Error ? err.message : "Error al guardar");
        } finally {
            setSavingDues(false);
        }
    };

    const handleSubmitService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!svcName.trim()) return;
        setSavingService(true);
        setServicesError(null);
        try {
            const amount = parseMoney(svcAmount);
            if (editServiceId) {
                const updated = await updateService(editServiceId, svcName.trim(), amount);
                setServices((prev) =>
                    prev.map((s) => (s.id === editServiceId ? updated : s))
                        .sort((a, b) => a.name.localeCompare(b.name))
                );
            } else {
                const created = await saveService(svcName.trim(), amount);
                setServices((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
            }
            resetServiceForm();
        } catch (err) {
            setServicesError(err instanceof Error ? err.message : "Error al guardar servicio");
        } finally {
            setSavingService(false);
        }
    };

    const handleStartEdit = (svc: ServiceItem) => {
        setSvcName(svc.name);
        setSvcAmount(svc.amount.toString());
        setEditServiceId(svc.id);
    };

    const handleDeleteService = async (id: string) => {
        if (editServiceId === id) resetServiceForm();
        try {
            await deleteService(id);
            setServices((prev) => prev.filter((s) => s.id !== id));
        } catch (err) {
            setServicesError(err instanceof Error ? err.message : "Error al eliminar servicio");
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

            <div className="config-grid">
            <div className="config-card">
                <h3>Valores Iniciales</h3>
                <p className="config-description">
                    Establecé los saldos iniciales de cada caja. Estos valores se usan
                    para calcular los saldos acumulados desde el inicio de los movimientos (2025).
                </p>

                <form onSubmit={handleSaveBalances} className="config-form">
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

            <div className="config-card">
                <h3>Cuotas</h3>
                <p className="config-description">
                    Establecé los valores por defecto para la cuota de socio y el costo de cementerio.
                    Estos valores se cargarán automáticamente al crear un nuevo movimiento.
                </p>

                <form onSubmit={handleSaveDues} className="config-form">
                    <div className="config-field">
                        <label>Cuota de Socio</label>
                        <input
                            type="text"
                            className="config-input"
                            value={memberFee}
                            onChange={(e) => setMemberFee(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="config-field">
                        <label>Años de consideración</label>
                        <input
                            type="number"
                            className="config-input"
                            value={considerationYears}
                            onChange={(e) => setConsiderationYears(e.target.value)}
                            min={0}
                            max={9}
                            step={1}
                            placeholder="0"
                        />
                    </div>

                    <div className="config-cemetery-section">
                        <label className="config-cemetery-title">Cuotas de Cementerio</label>
                        <p className="config-cemetery-subtitle">
                            Definí el valor mensual para cada tipo de sepultura,区分 socios y no socios.
                        </p>
                        <div className="config-cemetery-table">
                            <div className="config-cemetery-header">
                                <div className="config-cemetery-cell config-cemetery-label"></div>
                                <div className="config-cemetery-cell config-cemetery-col-header">Socios</div>
                                <div className="config-cemetery-cell config-cemetery-col-header">No Socios</div>
                            </div>
                            <div className="config-cemetery-row">
                                <div className="config-cemetery-cell config-cemetery-row-label">Nicho</div>
                                <div className="config-cemetery-cell">
                                    <input
                                        type="text"
                                        className="config-input"
                                        value={nichoMemberFee}
                                        onChange={(e) => setNichoMemberFee(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="config-cemetery-cell">
                                    <input
                                        type="text"
                                        className="config-input"
                                        value={nichoNonMemberFee}
                                        onChange={(e) => setNichoNonMemberFee(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="config-cemetery-row">
                                <div className="config-cemetery-cell config-cemetery-row-label">Urna</div>
                                <div className="config-cemetery-cell">
                                    <input
                                        type="text"
                                        className="config-input"
                                        value={urnaMemberFee}
                                        onChange={(e) => setUrnaMemberFee(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="config-cemetery-cell">
                                    <input
                                        type="text"
                                        className="config-input"
                                        value={urnaNonMemberFee}
                                        onChange={(e) => setUrnaNonMemberFee(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="config-cemetery-row">
                                <div className="config-cemetery-cell config-cemetery-row-label">Bolsa</div>
                                <div className="config-cemetery-cell">
                                    <input
                                        type="text"
                                        className="config-input"
                                        value={bolsaMemberFee}
                                        onChange={(e) => setBolsaMemberFee(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="config-cemetery-cell">
                                    <input
                                        type="text"
                                        className="config-input"
                                        value={bolsaNonMemberFee}
                                        onChange={(e) => setBolsaNonMemberFee(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {duesError && <div className="config-error">{duesError}</div>}
                    {duesSuccess && <div className="config-success">Valores guardados correctamente</div>}

                    <button type="submit" className="config-save-btn" disabled={savingDues}>
                        {savingDues ? (
                            <><Loader size={16} className="spin" /> Guardando...</>
                        ) : (
                            <><Save size={16} /> Guardar</>
                        )}
                    </button>
                </form>
            </div>

            <div className="config-card">
                <h3>Servicios</h3>
                <p className="config-description">
                    Gestioná los servicios disponibles para cobrar. Se mostrarán en el formulario de nuevo movimiento.
                </p>

                <form onSubmit={handleSubmitService} className="config-form">
                    <div className="config-field">
                        <label>{editServiceId ? "Nombre del servicio" : "Nuevo servicio"}</label>
                        <input
                            type="text"
                            className="config-input"
                            value={svcName}
                            onChange={(e) => setSvcName(e.target.value)}
                            placeholder="Nombre del servicio"
                        />
                    </div>

                    <div className="config-field">
                        <label>Costo</label>
                        <input
                            type="text"
                            className="config-input"
                            value={svcAmount}
                            onChange={(e) => setSvcAmount(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>

                    {servicesError && <div className="config-error">{servicesError}</div>}

                    <div className="config-form-actions" style={{ display: "flex", gap: 8 }}>
                        <button type="submit" className="config-save-btn" disabled={savingService || !svcName.trim()}>
                            {savingService ? (
                                <><Loader size={16} className="spin" /> Guardando...</>
                            ) : editServiceId ? (
                                <><Save size={16} /> Actualizar Servicio</>
                            ) : (
                                <><Plus size={16} /> Agregar Servicio</>
                            )}
                        </button>
                        {editServiceId && (
                            <button type="button" className="config-save-btn" onClick={resetServiceForm}
                                style={{ background: "#6c757d" }}>
                                <X size={16} /> Cancelar
                            </button>
                        )}
                    </div>
                </form>

                {services.length > 0 && (
                    <div className="services-list" style={{ marginTop: 16 }}>
                        {services.map((svc) => (
                            <div key={svc.id} className="service-item" style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "8px 0", borderBottom: "1px solid var(--border)", gap: 8,
                            }}>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontWeight: 600 }}>{svc.name}</span>
                                    <span style={{ marginLeft: 12, color: "var(--muted)" }}>
                                        $ {svc.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <button type="button" onClick={() => handleStartEdit(svc)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--azul-institucional)", padding: 4 }}>
                                    <Pencil size={16} />
                                </button>
                                <button type="button" onClick={() => handleDeleteService(svc.id)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#dc3545", padding: 4 }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};

export default Config;
