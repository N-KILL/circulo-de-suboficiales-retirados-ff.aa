import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDuesConfig, upsertDuesConfig } from "../src/database/duesConfigRepository";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "GET") {
            const config = await getDuesConfig();
            res.status(200).json(config);
            return;
        }
        if (req.method === "POST") {
            const { member_fee, cemetery_fee, consideration_years } = req.body;
            if (member_fee === undefined || cemetery_fee === undefined) {
                res.status(400).json({ error: "Faltan parámetros member_fee y/o cemetery_fee" });
                return;
            }
            const result = await upsertDuesConfig(member_fee, cemetery_fee, consideration_years);
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
