import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAllPersons } from "../src/database/personsRepository.js";
import { searchPersons } from "../src/database/membersRepository.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Método no permitido" });
        return;
    }

    try {
        const q = (req.query.q as string) || "";
        if (q) {
            const persons = await searchPersons(q);
            res.status(200).json(persons);
        } else {
            const persons = await getAllPersons();
            res.status(200).json(persons);
        }
    } catch (error) {
        console.error("Error al obtener personas:", error);
        res.status(500).json({ error: "Error al obtener personas" });
    }
}
