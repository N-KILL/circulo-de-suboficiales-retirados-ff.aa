import { randomUUID } from "node:crypto";
import type { Person } from "../models/members.js";
import { getSql } from "./connection.js";
import type { PersonRow } from "./types.js";

export async function upsertPerson(person: Person): Promise<string | null> {
    if (!person.nombre?.trim()) return null;
    const sql = getSql();
    const nombre = person.nombre.trim();

    let existing: PersonRow[];

    if (person.documento?.trim()) {
        existing = await sql`
            SELECT id FROM persons WHERE documento = ${person.documento.trim()} LIMIT 1
        ` as PersonRow[];
        if (existing.length === 0) {
            existing = await sql`
                SELECT id FROM persons WHERE nombre ILIKE ${nombre} LIMIT 1
            ` as PersonRow[];
        }
    } else {
        existing = await sql`
            SELECT id FROM persons WHERE nombre ILIKE ${nombre} LIMIT 1
        ` as PersonRow[];
    }

    if (existing.length > 0) {
        const existingId = existing[0].id;
        await sql`
            UPDATE persons SET
                nombre = ${nombre},
                tipo_doc = ${person.tipoDoc || null},
                documento = ${person.documento?.trim() || null},
                domicilio = ${person.domicilio || null},
                telefono = ${person.telefono || null}
            WHERE id = ${existingId}
        `;
        return existingId;
    }

    const id = person.id || randomUUID();
    await sql`
        INSERT INTO persons (id, nombre, tipo_doc, documento, domicilio, telefono)
        VALUES (
            ${id}, ${nombre}, ${person.tipoDoc || null},
            ${person.documento?.trim() || null}, ${person.domicilio || null},
            ${person.telefono || null}
        )
        ON CONFLICT (id) DO UPDATE SET
            nombre = EXCLUDED.nombre,
            tipo_doc = EXCLUDED.tipo_doc,
            documento = EXCLUDED.documento,
            domicilio = EXCLUDED.domicilio,
            telefono = EXCLUDED.telefono
    `;
    return id;
}

export async function getAllPersons(): Promise<Person[]> {
    const sql = getSql();
    const rows = await sql`
        SELECT * FROM persons ORDER BY nombre
    `;
    return (rows as PersonRow[]).map((row) => ({
        id: row.id,
        nombre: row.nombre,
        tipoDoc: row.tipo_doc ?? "",
        documento: row.documento ?? "",
        domicilio: row.domicilio ?? "",
        telefono: row.telefono ?? "",
    }));
}

export async function getPersonById(id: string): Promise<Person | null> {
    const sql = getSql();
    const rows = (await sql`
        SELECT * FROM persons WHERE id = ${id} LIMIT 1
    `) as PersonRow[];
    const row = rows[0];
    if (!row) return null;
    return {
        id: row.id,
        nombre: row.nombre,
        tipoDoc: row.tipo_doc ?? "",
        documento: row.documento ?? "",
        domicilio: row.domicilio ?? "",
        telefono: row.telefono ?? "",
    };
}

export async function deletePersonById(id: string): Promise<void> {
    const sql = getSql();
    await sql`DELETE FROM persons WHERE id = ${id}`;
}

export type PersonMember = {
    id: string;
    numeroDeSocio: string;
    nombre: string;
};

export async function getMembersByPersonId(personId: string): Promise<PersonMember[]> {
    const sql = getSql();
    type RawRow = { id: string; numero_de_socio: string; nombre: string };
    const rows = await sql`
        SELECT id, numero_de_socio, nombre FROM members
        WHERE apoderado1_id = ${personId} OR apoderado2_id = ${personId}
        ORDER BY numero_de_socio
    `;
    return (rows as RawRow[]).map((row) => ({
        id: row.id,
        numeroDeSocio: row.numero_de_socio,
        nombre: row.nombre,
    }));
}
