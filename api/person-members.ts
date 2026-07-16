import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMembersByPersonId } from "../src/database/personsRepository.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Método no permitido" });
        return;
    }

    const personId = req.query.personId as string | undefined;
    if (!personId) {
        res.status(400).json({ error: "Falta el parámetro personId" });
        return;
    }

    try {
        const members = await getMembersByPersonId(personId);
        res.status(200).json(members);
    } catch (error) {
        console.error("Error al obtener miembros de la persona:", error);
        res.status(500).json({ error: "Error al obtener miembros" });
    }
}
