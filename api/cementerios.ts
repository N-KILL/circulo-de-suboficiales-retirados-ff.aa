import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
    getAllCementeriosGrid,
    getCementeriosByNicho,
    getCementeriosByOwnerId,
    getCementerioOwnerIds,
    updateCementerio,
} from "../src/database/cementeriosRepository";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "GET") {
            const nicho = req.query.nicho as string | undefined;
            const ownerId = req.query.ownerId as string | undefined;
            const isSocio = req.query.isSocio === "true";
            const ownersOnly = req.query.owners === "true";

            if (ownersOnly) {
                const ids = await getCementerioOwnerIds();
                res.status(200).json(ids);
                return;
            }
            if (ownerId) {
                const items = await getCementeriosByOwnerId(ownerId, isSocio);
                res.status(200).json(items);
                return;
            }
            if (nicho) {
                const items = await getCementeriosByNicho(nicho);
                res.status(200).json(items);
            } else {
                const items = await getAllCementeriosGrid();
                res.status(200).json(items);
            }
            return;
        }

        if (req.method === "PATCH") {
            const id = req.query.id as string | undefined;
            if (!id) {
                res.status(400).json({ error: "Falta el parámetro id" });
                return;
            }
            const data = req.body;
            await updateCementerio(id, data);
            res.status(200).json({ success: true });
            return;
        }

        if (req.method === "OPTIONS") {
            res.status(204).end();
            return;
        }

        res.status(405).json({ error: "Método no permitido" });
    } catch (error) {
        console.error("API cementerios error:", error);
        res.status(500).json({
            error: "Error al procesar la solicitud",
        });
    }
}
