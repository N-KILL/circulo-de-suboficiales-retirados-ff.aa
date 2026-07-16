import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathname = "/api/" + (req.query.slug as string[]).join("/");
  const method = req.method ?? "GET";

  try {
    if (method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    // GET /api/members
    if (pathname === "/api/members" && method === "GET") {
      const { getAllMembers } = await import("../src/database/membersRepository.js");
      const members = await getAllMembers();
      res.status(200).json(members);
      return;
    }

    // GET /api/members/family
    if (pathname === "/api/members/family" && method === "GET") {
      const memberId = req.query.memberId as string | undefined;
      if (!memberId) {
        res.status(400).json({ error: "Falta el parámetro memberId" });
        return;
      }
      const { getFamilyMembers } = await import("../src/database/membersRepository.js");
      const members = await getFamilyMembers(memberId);
      res.status(200).json(members);
      return;
    }

    // GET /api/members/debt-status
    if (pathname === "/api/members/debt-status" && method === "GET") {
      const { getMembersDebtStatus } = await import("../src/database/duesRepository.js");
      const { getDuesConfig } = await import("../src/database/duesConfigRepository.js");
      const [members, config] = await Promise.all([
        getMembersDebtStatus(),
        getDuesConfig(),
      ]);
      res.status(200).json({
        members,
        consideration_years: config?.consideration_years ?? 0,
      });
      return;
    }

    // GET /api/persons
    if (pathname === "/api/persons" && method === "GET") {
      const q = (req.query.q as string) || "";
      if (q) {
        const { searchPersons } = await import("../src/database/membersRepository.js");
        const persons = await searchPersons(q);
        res.status(200).json(persons);
      } else {
        const { getAllPersons } = await import("../src/database/personsRepository.js");
        const persons = await getAllPersons();
        res.status(200).json(persons);
      }
      return;
    }

    // GET /api/movements
    if (pathname === "/api/movements" && method === "GET") {
      const { getAllMovements } = await import("../src/database/pettyCashRepository.js");
      const movements = await getAllMovements();
      res.status(200).json(movements);
      return;
    }

    // /api/movement
    if (pathname === "/api/movement") {
      const { getMovementById, updateMovement, deleteMovement } = await import("../src/database/pettyCashRepository.js");
      const { getDueByMovementId, deleteDueByMovementId, updateDueByMovementId } = await import("../src/database/duesRepository.js");
      const { getServiceRecordsByMovement, deleteServiceRecordsByMovement } = await import("../src/database/serviceRecordsRepository.js");
      const { getCementerioMovimientosByMovement, deleteCementerioMovimientosByMovement } = await import("../src/database/cementerioMovimientosRepository.js");
      const id = req.query.id as string | undefined;

      if (!id) {
        res.status(400).json({ error: "Falta el parámetro id" });
        return;
      }

      if (method === "GET") {
        const movement = await getMovementById(id);
        if (!movement) {
          res.status(404).json({ error: "Movimiento no encontrado" });
          return;
        }
        const [due, serviceRecords, cementerioMovimientos] = await Promise.all([
          getDueByMovementId(id),
          getServiceRecordsByMovement(id),
          getCementerioMovimientosByMovement(id),
        ]);
        res.status(200).json({ ...movement, linked_due: due, linked_service_records: serviceRecords, linked_cementerio_movimientos: cementerioMovimientos });
        return;
      }

      if (method === "PUT") {
        const data = req.body;
        if (!data) {
          res.status(400).json({ error: "Faltan datos" });
          return;
        }
        const { due: dueData, ...movementData } = data;
        await updateMovement(id, movementData);
        if (dueData) {
          await updateDueByMovementId(id, dueData);
        }
        res.status(200).json({ success: true });
        return;
      }

      if (method === "DELETE") {
        await deleteDueByMovementId(id);
        await deleteServiceRecordsByMovement(id);
        await deleteCementerioMovimientosByMovement(id);
        await deleteMovement(id);
        res.status(200).json({ success: true });
        return;
      }

      res.status(405).json({ error: "Método no permitido" });
      return;
    }

    // /api/member
    if (pathname === "/api/member") {
      if (method === "GET") {
        const id = req.query.id as string | undefined;
        if (!id) {
          res.status(400).json({ error: "Falta el parámetro id" });
          return;
        }
        const { getMemberById } = await import("../src/database/membersRepository.js");
        const member = await getMemberById(id);
        if (!member) {
          res.status(404).json({ error: "Socio no encontrado" });
          return;
        }
        res.status(200).json(member);
        return;
      }

      if (method === "POST") {
        const member = req.body;
        if (!member?.numeroDeSocio) {
          res.status(400).json({ error: "Falta el número de socio" });
          return;
        }
        const { upsertMember } = await import("../src/database/membersRepository.js");
        await upsertMember(member);
        res.status(200).json({ success: true });
        return;
      }

      if (method === "DELETE") {
        const id = req.query.id as string | undefined;
        if (!id) {
          res.status(400).json({ error: "Falta el parámetro id" });
          return;
        }
        const { deleteMemberById } = await import("../src/database/membersRepository.js");
        await deleteMemberById(id);
        res.status(200).json({ success: true });
        return;
      }

      res.status(405).json({ error: "Método no permitido" });
      return;
    }

    // /api/person
    if (pathname === "/api/person") {
      if (method === "GET") {
        const id = req.query.id as string | undefined;
        if (!id) {
          res.status(400).json({ error: "Falta el parámetro id" });
          return;
        }
        const { getPersonById } = await import("../src/database/personsRepository.js");
        const person = await getPersonById(id);
        if (!person) {
          res.status(404).json({ error: "Persona no encontrada" });
          return;
        }
        res.status(200).json(person);
        return;
      }

      if (method === "POST") {
        const person = req.body;
        if (!person?.nombre?.trim()) {
          res.status(400).json({ error: "Falta el nombre de la persona" });
          return;
        }
        const { upsertPerson } = await import("../src/database/personsRepository.js");
        await upsertPerson(person);
        res.status(200).json({ success: true });
        return;
      }

      if (method === "DELETE") {
        const id = req.query.id as string | undefined;
        if (!id) {
          res.status(400).json({ error: "Falta el parámetro id" });
          return;
        }
        const { deletePersonById } = await import("../src/database/personsRepository.js");
        await deletePersonById(id);
        res.status(200).json({ success: true });
        return;
      }

      res.status(405).json({ error: "Método no permitido" });
      return;
    }

    // GET /api/person-members
    if (pathname === "/api/person-members" && method === "GET") {
      const personId = req.query.personId as string | undefined;
      if (!personId) {
        res.status(400).json({ error: "Falta el parámetro personId" });
        return;
      }
      const { getMembersByPersonId } = await import("../src/database/personsRepository.js");
      const members = await getMembersByPersonId(personId);
      res.status(200).json(members);
      return;
    }

    // /api/initial-balances
    if (pathname === "/api/initial-balances") {
      if (method === "GET") {
        const { getInitialBalances } = await import("../src/database/initialBalancesRepository.js");
        const balances = await getInitialBalances();
        res.status(200).json(balances);
        return;
      }

      if (method === "POST") {
        const { caja_chica, banco } = req.body as {
          caja_chica?: number;
          banco?: number;
        };
        if (caja_chica === undefined || banco === undefined) {
          res.status(400).json({ error: "Faltan parámetros caja_chica y/o banco" });
          return;
        }
        const { upsertInitialBalances } = await import("../src/database/initialBalancesRepository.js");
        const result = await upsertInitialBalances(caja_chica, banco);
        res.status(200).json(result);
        return;
      }

      res.status(405).json({ error: "Método no permitido" });
      return;
    }

    // POST /api/payment
    if (pathname === "/api/payment" && method === "POST") {
      const payment = req.body;
      if (!payment?.date || !payment?.amount) {
        res.status(400).json({ error: "Faltan datos requeridos" });
        return;
      }
      const { insertMovement } = await import("../src/database/pettyCashRepository.js");
      const movementId = await insertMovement({
        date: payment.date,
        detail: payment.detail,
        amount: payment.amount,
        type: "ingreso",
        mode: payment.mode,
        concept: payment.concept ?? null,
      });
      res.status(200).json({ success: true, id: movementId });
      return;
    }

    // /api/cementerios
    if (pathname === "/api/cementerios") {
      const {
        getAllCementeriosGrid,
        getCementeriosByNicho,
        getCementeriosByOwnerId,
        getCementerioOwnerIds,
        updateCementerio,
      } = await import("../src/database/cementeriosRepository.js");

      if (method === "GET") {
        const nicho = req.query.nicho as string | undefined;
        const ownerId = req.query.ownerId as string | undefined;
        const isSocio = req.query.isSocio === "true";
        const ownersOnly = req.query.owners === "true";

        if (ownersOnly) {
          const ids = await getCementerioOwnerIds();
          res.status(200).json(ids);
          return;
        }
        if (ownerId) {
          const items = await getCementeriosByOwnerId(ownerId, isSocio);
          res.status(200).json(items);
          return;
        }
        if (nicho) {
          const items = await getCementeriosByNicho(nicho);
          res.status(200).json(items);
        } else {
          const items = await getAllCementeriosGrid();
          res.status(200).json(items);
        }
        return;
      }

      if (method === "PATCH") {
        const id = req.query.id as string | undefined;
        if (!id) {
          res.status(400).json({ error: "Falta el parámetro id" });
          return;
        }
        const data = req.body;
        await updateCementerio(id, data);
        res.status(200).json({ success: true });
        return;
      }

      res.status(405).json({ error: "Método no permitido" });
      return;
    }

    // /api/cementerio-movimientos
    if (pathname === "/api/cementerio-movimientos") {
      const {
        getCementerioMovimientosByMovement,
        getCementerioMovimientosByNicho,
        insertCementerioMovimiento,
        hasCementerioMovimientosByNicho,
      } = await import("../src/database/cementerioMovimientosRepository.js");

      if (method === "GET") {
        const movementId = req.query.movementId as string | undefined;
        const nicho = req.query.nicho as string | undefined;
        const hasNicho = req.query.hasNicho as string | undefined;

        if (hasNicho) {
          const exists = await hasCementerioMovimientosByNicho(hasNicho);
          res.status(200).json({ exists });
          return;
        }
        if (movementId) {
          const records = await getCementerioMovimientosByMovement(movementId);
          res.status(200).json(records);
          return;
        }
        if (nicho) {
          const records = await getCementerioMovimientosByNicho(nicho);
          res.status(200).json(records);
          return;
        }
        res.status(400).json({ error: "Falta el parámetro movementId o nicho" });
        return;
      }

      if (method === "POST") {
        const body = req.body;
        if (!body?.movement_id || !body?.nicho || !body?.fecha_pago) {
          res.status(400).json({ error: "Faltan datos requeridos (movement_id, nicho, fecha_pago)" });
          return;
        }
        const id = await insertCementerioMovimiento({
          movement_id: body.movement_id,
          cementerio_id: body.cementerio_id ?? null,
          nicho: body.nicho,
          tipo: body.tipo ?? null,
          ocupante: body.ocupante ?? null,
          anios_pagados: body.anios_pagados ?? [],
          importe: body.importe ?? 0,
          fecha_pago: body.fecha_pago,
          member_id: body.member_id ?? null,
          person_id: body.person_id ?? null,
        });
        res.status(200).json({ success: true, id });
        return;
      }

      res.status(405).json({ error: "Método no permitido" });
      return;
    }

    // /api/dues
    if (pathname === "/api/dues") {
      const {
        getAllDues,
        getDuesByMember,
        getDuesByPerson,
        insertDue,
        getDuesByMemberWithCemeteryCheck,
      } = await import("../src/database/duesRepository.js");

      if (method === "GET") {
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

      if (method === "POST") {
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
      return;
    }

    // /api/dues-config
    if (pathname === "/api/dues-config") {
      if (method === "GET") {
        const { getDuesConfig } = await import("../src/database/duesConfigRepository.js");
        const config = await getDuesConfig();
        res.status(200).json(config);
        return;
      }

      if (method === "POST") {
        const {
          member_fee, consideration_years,
          nicho_member_fee, nicho_non_member_fee,
          urna_member_fee, urna_non_member_fee,
          bolsa_member_fee, bolsa_non_member_fee,
        } = req.body;
        if (member_fee === undefined) {
          res.status(400).json({ error: "Falta parámetro member_fee" });
          return;
        }
        const { upsertDuesConfig } = await import("../src/database/duesConfigRepository.js");
        const result = await upsertDuesConfig(
          member_fee, consideration_years ?? 0,
          nicho_member_fee ?? 0, nicho_non_member_fee ?? 0,
          urna_member_fee ?? 0, urna_non_member_fee ?? 0,
          bolsa_member_fee ?? 0, bolsa_non_member_fee ?? 0,
        );
        res.status(200).json(result);
        return;
      }

      res.status(405).json({ error: "Método no permitido" });
      return;
    }

    // /api/services
    if (pathname === "/api/services") {
      const { getAllServices, insertService, updateService, deleteService } = await import("../src/database/servicesRepository.js");

      if (method === "GET") {
        const services = await getAllServices();
        res.status(200).json(services);
        return;
      }

      if (method === "POST") {
        const { name, amount } = req.body;
        if (!name?.trim()) {
          res.status(400).json({ error: "Falta el name del servicio" });
          return;
        }
        const result = await insertService(name.trim(), amount ?? 0);
        res.status(200).json(result);
        return;
      }

      if (method === "PUT") {
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

      if (method === "DELETE") {
        const id = req.query.id as string;
        if (!id) {
          res.status(400).json({ error: "Falta el parámetro id" });
          return;
        }
        await deleteService(id);
        res.status(200).json({ success: true });
        return;
      }

      res.status(405).json({ error: "Método no permitido" });
      return;
    }

    // /api/service-records
    if (pathname === "/api/service-records") {
      const {
        getAllServiceRecords,
        getServiceRecordById,
        getServiceRecordsByMember,
        getServiceRecordsByPerson,
        getServiceRecordsByMovement,
        insertServiceRecord,
        updateServiceRecord,
        deleteServiceRecord,
      } = await import("../src/database/serviceRecordsRepository.js");

      if (method === "GET") {
        const id = req.query.id as string | undefined;
        const memberId = req.query.memberId as string | undefined;
        const personId = req.query.personId as string | undefined;
        const movementId = req.query.movementId as string | undefined;

        if (id) {
          const record = await getServiceRecordById(id);
          if (!record) {
            res.status(404).json({ error: "Registro no encontrado" });
            return;
          }
          res.status(200).json(record);
          return;
        }
        if (memberId) {
          const records = await getServiceRecordsByMember(memberId);
          res.status(200).json(records);
          return;
        }
        if (personId) {
          const records = await getServiceRecordsByPerson(personId);
          res.status(200).json(records);
          return;
        }
        if (movementId) {
          const records = await getServiceRecordsByMovement(movementId);
          res.status(200).json(records);
          return;
        }

        const records = await getAllServiceRecords();
        res.status(200).json(records);
        return;
      }

      if (method === "POST") {
        const { service_id, member_id, person_id, movement_id, amount, date, service_date, detail } = req.body;
        if (!service_id) {
          res.status(400).json({ error: "Falta el parámetro service_id" });
          return;
        }
        if (!date) {
          res.status(400).json({ error: "Falta el parámetro date" });
          return;
        }
        if (!member_id && !person_id) {
          res.status(400).json({ error: "Se requiere member_id o person_id" });
          return;
        }
        const result = await insertServiceRecord({
          service_id,
          member_id: member_id ?? null,
          person_id: person_id ?? null,
          movement_id: movement_id ?? null,
          amount: amount ?? 0,
          date,
          service_date: service_date ?? null,
          detail: detail ?? null,
        });
        res.status(200).json(result);
        return;
      }

      if (method === "PUT") {
        const { id, service_id, member_id, person_id, movement_id, amount, date, service_date, detail } = req.body;
        if (!id) {
          res.status(400).json({ error: "Falta el parámetro id" });
          return;
        }
        const result = await updateServiceRecord(id, {
          service_id,
          member_id: member_id ?? null,
          person_id: person_id ?? null,
          movement_id: movement_id ?? null,
          amount,
          date,
          service_date: service_date ?? null,
          detail: detail ?? null,
        });
        if (!result) {
          res.status(404).json({ error: "Registro no encontrado" });
          return;
        }
        res.status(200).json(result);
        return;
      }

      if (method === "DELETE") {
        const id = req.query.id as string;
        if (!id) {
          res.status(400).json({ error: "Falta el parámetro id" });
          return;
        }
        await deleteServiceRecord(id);
        res.status(200).json({ success: true });
        return;
      }

      res.status(405).json({ error: "Método no permitido" });
      return;
    }

    res.status(404).json({ error: "Ruta no encontrada" });
  } catch (error) {
    console.error(`Error en ${pathname}:`, error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
