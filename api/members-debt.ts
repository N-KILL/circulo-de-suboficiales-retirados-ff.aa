import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMembersDebtStatus } from "../src/database/duesRepository.js";
import { getDuesConfig } from "../src/database/duesConfigRepository.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method !== "GET") {
            res.status(405).json({ error: "Método no permitido" });
            return;
        }
        const [members, config] = await Promise.all([
            getMembersDebtStatus(),
            getDuesConfig(),
        ]);
        res.status(200).json({
            members,
            consideration_years: config?.consideration_years ?? 0,
        });
    } catch (error) {
        console.error("Error en /api/members/debt-status:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}
