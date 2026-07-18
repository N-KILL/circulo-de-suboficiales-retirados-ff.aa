import React, { useEffect, useState } from "react";
import {
    fetchInitialBalances,
} from "../../services/initialBalancesApi";
import {
    fetchDuesConfig,
} from "../../services/duesConfigApi";
import {
    fetchServices,
    type ServiceItem,
} from "../../services/servicesApi";
import BalancesConfig from "./BalancesConfig";
import DuesConfig from "./DuesConfig";
import ServicesConfig from "./ServicesConfig";
import "./Config.css";

const Config: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [cajaChica, setCajaChica] = useState("0");
    const [banco, setBanco] = useState("0");
    const [memberFee, setMemberFee] = useState("0");
    const [considerationYears, setConsiderationYears] = useState("0");
    const [nichoMemberFee, setNichoMemberFee] = useState("0");
    const [nichoNonMemberFee, setNichoNonMemberFee] = useState("0");
    const [urnaMemberFee, setUrnaMemberFee] = useState("0");
    const [urnaNonMemberFee, setUrnaNonMemberFee] = useState("0");
    const [bolsaMemberFee, setBolsaMemberFee] = useState("0");
    const [bolsaNonMemberFee, setBolsaNonMemberFee] = useState("0");
    const [asistencialFee, setAsistencialFee] = useState("0");
    const [planSaludFee, setPlanSaludFee] = useState("0");
    const [feeAct, setFeeAct] = useState("0");
    const [feeActA, setFeeActA] = useState("0");
    const [feeAdh, setFeeAdh] = useState("0");
    const [feePart, setFeePart] = useState("0");
    const [feeVit, setFeeVit] = useState("0");
    const [services, setServices] = useState<ServiceItem[]>([]);

    useEffect(() => {
        Promise.all([
            fetchInitialBalances(),
            fetchDuesConfig(),
            fetchServices(),
        ])
            .then(([balances, duesCfg, svcs]) => {
                if (balances) {
                    setCajaChica(balances.caja_chica.toString());
                    setBanco(balances.banco.toString());
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
                    setAsistencialFee(duesCfg.asistencial_fee.toString());
                    setPlanSaludFee(duesCfg.plan_salud_fee.toString());
                    setFeeAct(duesCfg.fee_act.toString());
                    setFeeActA(duesCfg.fee_act_a.toString());
                    setFeeAdh(duesCfg.fee_adh.toString());
                    setFeePart(duesCfg.fee_part.toString());
                    setFeeVit(duesCfg.fee_vit.toString());
                }
                setServices(svcs);
            })
            .catch((err) => setError(err.message || "Error al cargar datos"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="dashboard-loading">Cargando...</div>;
    if (error) return <div className="dashboard-loading" style={{ color: "var(--danger)" }}>{error}</div>;

    return (
        <div className="config-container">
            <div className="treasury-header-row">
                <h2>Configuración</h2>
            </div>
            <div className="config-grid">
                <BalancesConfig initialCajaChica={cajaChica} initialBanco={banco} />
                <DuesConfig
                    initialMemberFee={memberFee}
                    initialConsiderationYears={considerationYears}
                    initialNichoMemberFee={nichoMemberFee}
                    initialNichoNonMemberFee={nichoNonMemberFee}
                    initialUrnaMemberFee={urnaMemberFee}
                    initialUrnaNonMemberFee={urnaNonMemberFee}
                    initialBolsaMemberFee={bolsaMemberFee}
                    initialBolsaNonMemberFee={bolsaNonMemberFee}
                    initialAsistencialFee={asistencialFee}
                    initialPlanSaludFee={planSaludFee}
                    initialFeeAct={feeAct}
                    initialFeeActA={feeActA}
                    initialFeeAdh={feeAdh}
                    initialFeePart={feePart}
                    initialFeeVit={feeVit}
                />
                <ServicesConfig initialServices={services} />
            </div>
        </div>
    );
};

export default Config;
