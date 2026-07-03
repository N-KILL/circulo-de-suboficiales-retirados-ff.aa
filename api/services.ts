import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAllServices, insertService, updateService, deleteService } from "../src/database/servicesRepository";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "GET") {
            const services = await getAllServices();
            res.status(200).json(services);
            return;
        }
        if (req.method === "POST") {
            const { name, amount } = req.body;
            if (!name?.trim()) {
                res.status(400).json({ error: "Falta el name del servicio" });
                return;
            }
            const result = await insertService(name.trim(), amount ?? 0);
            res.status(200).json(result);
            return;
        }
        if (req.method === "PUT") {
            const { id, name, amount } = req.body;
            if (!id || !name?.trim()) {
                res.status(400).json({ error: "Faltan parámetros id y/o name" });
                return;
            }
            const result = await updateService(id, name.trim(), amount ?? 0);
            if (!result) {
                res.status(404).json({ error: "Servicio no encontrado" });
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
            await deleteService(id);
            res.status(200).json({ success: true });
            return;
        }
        if (req.method === "OPTIONS") {
            res.status(204).end();
            return;
        }
        res.status(405).json({ error: "Método no permitido" });
    } catch (error) {
        console.error("Error en /api/services:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}
