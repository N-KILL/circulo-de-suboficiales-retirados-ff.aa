import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
    getAllDues,
    getDuesByMember,
    getDuesByPerson,
    insertDue,
    getDuesByMemberWithCemeteryCheck,
} from "../src/database/duesRepository";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }

    try {
        if (req.method === "GET") {
            const memberId = req.query.memberId as string | undefined;
            const personId = req.query.personId as string | undefined;
            const check = req.query.check as string | undefined;

            if (memberId && check === "cementerio") {
                const result = await getDuesByMemberWithCemeteryCheck(memberId);
                res.status(200).json(result);
                return;
            }

            if (memberId) {
                const dues = await getDuesByMember(memberId);
                res.status(200).json(dues);
                return;
            }

            if (personId) {
                const dues = await getDuesByPerson(personId);
                res.status(200).json(dues);
                return;
            }

            const all = await getAllDues();
            res.status(200).json(all);
            return;
        }

        if (req.method === "POST") {
            const body = req.body;
            if (!body?.type || !body?.payment_date) {
                res.status(400).json({ error: "Faltan datos requeridos (type, payment_date)" });
                return;
            }
            const id = await insertDue({
                type: body.type,
                payment_date: body.payment_date,
                period: body.period ?? null,
                member_id: body.member_id ?? null,
                person_id: body.person_id ?? null,
                movement_id: body.movement_id ?? null,
                family_group: body.family_group ?? null,
                paid_members: body.paid_members ?? null,
            });
            res.status(200).json({ success: true, id });
            return;
        }

        res.status(405).json({ error: "Método no permitido" });
    } catch (error) {
        console.error("Error en /api/dues:", error);
        res.status(500).json({ error: "Error al procesar cuotas" });
    }
}
