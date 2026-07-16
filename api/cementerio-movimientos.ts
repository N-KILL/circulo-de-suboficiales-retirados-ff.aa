import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
    getCementerioMovimientosByMovement,
    getCementerioMovimientosByNicho,
    insertCementerioMovimiento,
    hasCementerioMovimientosByNicho,
} from "../src/database/cementerioMovimientosRepository.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "GET") {
            const movementId = req.query.movementId as string | undefined;
            const nicho = req.query.nicho as string | undefined;
            const hasNicho = req.query.hasNicho as string | undefined;

            if (hasNicho) {
                const exists = await hasCementerioMovimientosByNicho(hasNicho);
                res.status(200).json({ exists });
                return;
            }
            if (movementId) {
                const records = await getCementerioMovimientosByMovement(movementId);
                res.status(200).json(records);
                return;
            }
            if (nicho) {
                const records = await getCementerioMovimientosByNicho(nicho);
                res.status(200).json(records);
                return;
            }
            res.status(400).json({ error: "Falta el parámetro movementId o nicho" });
            return;
        }

        if (req.method === "POST") {
            const body = req.body;
            if (!body?.movement_id || !body?.nicho || !body?.fecha_pago) {
                res.status(400).json({ error: "Faltan datos requeridos (movement_id, nicho, fecha_pago)" });
                return;
            }
            const id = await insertCementerioMovimiento({
                movement_id: body.movement_id,
                cementerio_id: body.cementerio_id ?? null,
                nicho: body.nicho,
                tipo: body.tipo ?? null,
                ocupante: body.ocupante ?? null,
                anios_pagados: body.anios_pagados ?? [],
                importe: body.importe ?? 0,
                fecha_pago: body.fecha_pago,
                member_id: body.member_id ?? null,
                person_id: body.person_id ?? null,
            });
            res.status(200).json({ success: true, id });
            return;
        }

        if (req.method === "OPTIONS") {
            res.status(204).end();
            return;
        }

        res.status(405).json({ error: "Método no permitido" });
    } catch (error) {
        console.error("API cementerio-movimientos error:", error);
        res.status(500).json({ error: "Error al procesar la solicitud" });
    }
}
