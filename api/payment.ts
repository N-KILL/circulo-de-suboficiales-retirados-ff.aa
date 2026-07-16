import type { VercelRequest, VercelResponse } from "@vercel/node";
import { insertMovement } from "../src/database/pettyCashRepository.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ error: "Método no permitido" });
        return;
    }

    try {
        const payment = req.body;
        if (!payment?.date || !payment?.amount) {
            res.status(400).json({ error: "Faltan datos requeridos" });
            return;
        }

        const movementId = await insertMovement({
            date: payment.date,
            detail: payment.detail,
            amount: payment.amount,
            type: "ingreso",
            mode: payment.mode,
            concept: payment.concept ?? null,
        });

        res.status(200).json({ success: true, id: movementId });
    } catch (error) {
        console.error("Error al guardar el pago:", error);
        res.status(500).json({ error: "No se pudo guardar el pago" });
    }
}
