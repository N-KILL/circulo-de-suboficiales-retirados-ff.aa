import type { VercelRequest, VercelResponse } from "@vercel/node";
import { upsertPerson, getPersonById, deletePersonById } from "../src/database/personsRepository";
import type { Person } from "../src/models/members";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "POST") {
            const person = req.body as Person;
            if (!person?.nombre?.trim()) {
                res.status(400).json({ error: "Falta el nombre de la persona" });
                return;
            }
            await upsertPerson(person);
            res.status(200).json({ success: true });
            return;
        }

        if (req.method === "GET") {
            const id = req.query.id as string | undefined;
            if (!id) {
                res.status(400).json({ error: "Falta el parámetro id" });
                return;
            }
            const person = await getPersonById(id);
            if (!person) {
                res.status(404).json({ error: "Persona no encontrada" });
                return;
            }
            res.status(200).json(person);
            return;
        }

        if (req.method === "DELETE") {
            const id = req.query.id as string | undefined;
            if (!id) {
                res.status(400).json({ error: "Falta el parámetro id" });
                return;
            }
            await deletePersonById(id);
            res.status(200).json({ success: true });
            return;
        }

        res.status(405).json({ error: "Método no permitido" });
    } catch (error) {
        console.error("Error en /api/person:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}
