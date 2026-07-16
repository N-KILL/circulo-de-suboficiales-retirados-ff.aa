import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getInitialBalances, upsertInitialBalances } from "../src/database/initialBalancesRepository.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "GET") {
            const balances = await getInitialBalances();
            res.status(200).json(balances);
            return;
        }

        if (req.method === "POST") {
            const { caja_chica, banco } = req.body as {
                caja_chica?: number;
                banco?: number;
            };
            if (caja_chica === undefined || banco === undefined) {
                res.status(400).json({ error: "Faltan parámetros caja_chica y/o banco" });
                return;
            }
            const result = await upsertInitialBalances(caja_chica, banco);
            res.status(200).json(result);
            return;
        }

        res.status(405).json({ error: "Método no permitido" });
    } catch (error) {
        console.error("Error en /api/initial-balances:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}
