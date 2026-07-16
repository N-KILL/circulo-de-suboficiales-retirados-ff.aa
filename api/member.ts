import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMemberById, upsertMember, deleteMemberById } from "../src/database/membersRepository.js";
import type { Member } from "../src/models/members.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // POST — guardar socio
        if (req.method === "POST") {
            const member = req.body as Member;
            if (!member?.numeroDeSocio) {
                res.status(400).json({ error: "Falta el número de socio" });
                return;
            }
            await upsertMember(member);
            res.status(200).json({ success: true });
            return;
        }

        // GET — obtener socio por id
        if (req.method === "GET") {
            const id = req.query.id as string | undefined;
            if (!id) {
                res.status(400).json({ error: "Falta el parámetro id" });
                return;
            }
            const member = await getMemberById(id);
            if (!member) {
                res.status(404).json({ error: "Socio no encontrado" });
                return;
            }
            res.status(200).json(member);
            return;
        }

        // DELETE — eliminar socio
        if (req.method === "DELETE") {
            const id = req.query.id as string | undefined;
            if (!id) {
                res.status(400).json({ error: "Falta el parámetro id" });
                return;
            }
            await deleteMemberById(id);
            res.status(200).json({ success: true });
            return;
        }

        res.status(405).json({ error: "Método no permitido" });
    } catch (error) {
        console.error("Error en /api/member:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}
