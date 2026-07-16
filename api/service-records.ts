import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
    getAllServiceRecords,
    getServiceRecordById,
    getServiceRecordsByMember,
    getServiceRecordsByPerson,
    getServiceRecordsByMovement,
    insertServiceRecord,
    updateServiceRecord,
    deleteServiceRecord,
} from "../src/database/serviceRecordsRepository.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "GET") {
            const id = req.query.id as string | undefined;
            const memberId = req.query.memberId as string | undefined;
            const personId = req.query.personId as string | undefined;
            const movementId = req.query.movementId as string | undefined;

            if (id) {
                const record = await getServiceRecordById(id);
                if (!record) {
                    res.status(404).json({ error: "Registro no encontrado" });
                    return;
                }
                res.status(200).json(record);
                return;
            }
            if (memberId) {
                const records = await getServiceRecordsByMember(memberId);
                res.status(200).json(records);
                return;
            }
            if (personId) {
                const records = await getServiceRecordsByPerson(personId);
                res.status(200).json(records);
                return;
            }
            if (movementId) {
                const records = await getServiceRecordsByMovement(movementId);
                res.status(200).json(records);
                return;
            }

            const records = await getAllServiceRecords();
            res.status(200).json(records);
            return;
        }

        if (req.method === "POST") {
            const { service_id, member_id, person_id, movement_id, amount, date, service_date, detail } = req.body;
            if (!service_id) {
                res.status(400).json({ error: "Falta el parámetro service_id" });
                return;
            }
            if (!date) {
                res.status(400).json({ error: "Falta el parámetro date" });
                return;
            }
            if (!member_id && !person_id) {
                res.status(400).json({ error: "Se requiere member_id o person_id" });
                return;
            }
            const result = await insertServiceRecord({
                service_id,
                member_id: member_id ?? null,
                person_id: person_id ?? null,
                movement_id: movement_id ?? null,
                amount: amount ?? 0,
                date,
                service_date: service_date ?? null,
                detail: detail ?? null,
            });
            res.status(200).json(result);
            return;
        }

        if (req.method === "PUT") {
            const { id, service_id, member_id, person_id, movement_id, amount, date, service_date, detail } = req.body;
            if (!id) {
                res.status(400).json({ error: "Falta el parámetro id" });
                return;
            }
            const result = await updateServiceRecord(id, {
                service_id,
                member_id: member_id ?? null,
                person_id: person_id ?? null,
                movement_id: movement_id ?? null,
                amount,
                date,
                service_date: service_date ?? null,
                detail: detail ?? null,
            });
            if (!result) {
                res.status(404).json({ error: "Registro no encontrado" });
                return;
            }
            res.status(200).json(result);
            return;
        }

        if (req.method === "DELETE") {
            const id = req.query.id as string;
            if (!id) {
                res.status(400).json({ error: "Falta el parámetro id" });
                return;
            }
            await deleteServiceRecord(id);
            res.status(200).json({ success: true });
            return;
        }

        if (req.method === "OPTIONS") {
            res.status(204).end();
            return;
        }

        res.status(405).json({ error: "Método no permitido" });
    } catch (error) {
        console.error("Error en /api/service-records:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}
