import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMovementById, updateMovement, deleteMovement } from "../src/database/pettyCashRepository";
import { getDueByMovementId, deleteDueByMovementId, updateDueByMovementId } from "../src/database/duesRepository";
import { getServiceRecordsByMovement, deleteServiceRecordsByMovement } from "../src/database/serviceRecordsRepository";
import { getCementerioMovimientosByMovement, deleteCementerioMovimientosByMovement } from "../src/database/cementerioMovimientosRepository";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const id = req.query.id as string | undefined;
        if (!id) {
            res.status(400).json({ error: "Falta el parámetro id" });
            return;
        }

        if (req.method === "GET") {
            const movement = await getMovementById(id);
            if (!movement) {
                res.status(404).json({ error: "Movimiento no encontrado" });
                return;
            }
            const [due, serviceRecords, cementerioMovimientos] = await Promise.all([
                getDueByMovementId(id),
                getServiceRecordsByMovement(id),
                getCementerioMovimientosByMovement(id),
            ]);
            res.status(200).json({ ...movement, linked_due: due, linked_service_records: serviceRecords, linked_cementerio_movimientos: cementerioMovimientos });
            return;
        }

        if (req.method === "PUT") {
            const data = req.body;
            if (!data) {
                res.status(400).json({ error: "Faltan datos" });
                return;
            }
            const { due: dueData, ...movementData } = data;
            await updateMovement(id, movementData);
            if (dueData) {
                await updateDueByMovementId(id, dueData);
            }
            res.status(200).json({ success: true });
            return;
        }

        if (req.method === "DELETE") {
            await deleteDueByMovementId(id);
            await deleteServiceRecordsByMovement(id);
            await deleteCementerioMovimientosByMovement(id);
            await deleteMovement(id);
            res.status(200).json({ success: true });
            return;
        }

        res.status(405).json({ error: "Método no permitido" });
    } catch (error) {
        console.error("Error en /api/movement:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}
