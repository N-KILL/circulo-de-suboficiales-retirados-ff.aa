import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDuesConfig, upsertDuesConfig } from "../src/database/duesConfigRepository.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "GET") {
            const config = await getDuesConfig();
            res.status(200).json(config);
            return;
        }
        if (req.method === "POST") {
            const {
                member_fee, consideration_years,
                nicho_member_fee, nicho_non_member_fee,
                urna_member_fee, urna_non_member_fee,
                bolsa_member_fee, bolsa_non_member_fee,
            } = req.body;
            if (member_fee === undefined) {
                res.status(400).json({ error: "Falta parámetro member_fee" });
                return;
            }
            const result = await upsertDuesConfig(
                member_fee, consideration_years ?? 0,
                nicho_member_fee ?? 0, nicho_non_member_fee ?? 0,
                urna_member_fee ?? 0, urna_non_member_fee ?? 0,
                bolsa_member_fee ?? 0, bolsa_non_member_fee ?? 0,
            );
            res.status(200).json(result);
            return;
        }
        if (req.method === "OPTIONS") {
            res.status(204).end();
            return;
        }
        res.status(405).json({ error: "Método no permitido" });
    } catch (error) {
        console.error("Error en /api/dues-config:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}
