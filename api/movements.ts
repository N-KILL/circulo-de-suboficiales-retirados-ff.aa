import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAllMovements } from "../src/database/pettyCashRepository";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Método no permitido" });
        return;
    }

    try {
        const movements = await getAllMovements();
        res.status(200).json(movements);
    } catch (error) {
        console.error("Error al obtener movimientos de caja:", error);
        res.status(500).json({
            error: "No se pudieron cargar los movimientos de caja desde la base de datos",
        });
    }
}
