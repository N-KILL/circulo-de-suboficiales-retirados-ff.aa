import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAllMembers } from "../src/database/membersRepository";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Método no permitido" });
        return;
    }

    try {
        const members = await getAllMembers();
        res.status(200).json(members);
    } catch (error) {
        console.error("Error al obtener socios:", error);
        res.status(500).json({
            error: "No se pudieron cargar los socios desde la base de datos",
        });
    }
}
