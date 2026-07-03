import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFamilyMembers } from "../../src/database/membersRepository";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }

    if (req.method !== "GET") {
        res.status(405).json({ error: "Método no permitido" });
        return;
    }

    try {
        const memberId = req.query.memberId as string | undefined;
        if (!memberId) {
            res.status(400).json({ error: "Falta el parámetro memberId" });
            return;
        }
        const members = await getFamilyMembers(memberId);
        res.status(200).json(members);
    } catch (error) {
        console.error("Error en /api/members/family:", error);
        res.status(500).json({ error: "Error al obtener grupo familiar" });
    }
}
