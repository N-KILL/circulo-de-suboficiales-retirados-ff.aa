import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getAllMembers, getFamilyMembers, searchPersons, getMemberById, upsertMember, deleteMemberById, updateVitalicios } from "../src/database/membersRepository.js";
import { getAllPersons, getPersonById, upsertPerson, deletePersonById, getMembersByPersonId } from "../src/database/personsRepository.js";
import { getAllMovements, insertMovement, getMovementById, updateMovement, deleteMovement } from "../src/database/pettyCashRepository.js";
import { getAllDues, getDuesByMember, getDuesByPerson, insertDue, getDuesByMemberWithCemeteryCheck, getDueByMovementId, deleteDueByMovementId, updateDueByMovementId, getMembersDebtStatus } from "../src/database/duesRepository.js";
import { getDuesConfig, upsertDuesConfig } from "../src/database/duesConfigRepository.js";
import { getAllCementeriosGrid, getCementeriosByNicho, getCementeriosByOwnerId, getCementerioOwnerIds, updateCementerio } from "../src/database/cementeriosRepository.js";
import { getCementerioMovimientosByMovement, getCementerioMovimientosByNicho, getCementerioMovimientosByNichoAndArrendatario, insertCementerioMovimiento, hasCementerioMovimientosByNicho, getCementerioPagosMap, deleteCementerioMovimientosByMovement } from "../src/database/cementerioMovimientosRepository.js";
import { getAllServices, insertService, updateService, deleteService } from "../src/database/servicesRepository.js";
import { getAllServiceRecords, getServiceRecordById, getServiceRecordsByMember, getServiceRecordsByPerson, getServiceRecordsByMovement, insertServiceRecord, updateServiceRecord, deleteServiceRecord, deleteServiceRecordsByMovement } from "../src/database/serviceRecordsRepository.js";
import { getAllAppUsers, upsertAppUser, updateAppUserRole, deleteAppUser } from "../src/database/usersRepository.js";
import { getDebtsByMember, getDebtsByPerson, insertDebt, getBalanceByMember, getBalanceByPerson, reverseDebtsByMovementId } from "../src/database/debtsRepository.js";
import { getInitialBalances, upsertInitialBalances } from "../src/database/initialBalancesRepository.js";
import { getAllExternalServices, insertExternalService, updateExternalService, deleteExternalService } from "../src/database/externalServicesRepository.js";
import { getPaymentsByYear, upsertPayment, deletePayment, deletePaymentsByMovementId } from "../src/database/externalServicePaymentsRepository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function collectBody(req: express.Request): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

export async function startApiServer(port: number): Promise<void> {
  const server = express();
  server.use(express.json());

  server.use(async (req, res, next) => {
    const url = new URL(req.url ?? "", "http://localhost");
    const pathname = url.pathname;

    const routes: Record<string, string> = {
      "/api/members": "members",
      "/api/members/family": "membersFamily",
      "/api/members/debt-status": "membersDebt",
      "/api/members/vitalicios": "vitalicios",
      "/api/persons": "persons",
      "/api/movements": "movements",
      "/api/movement": "movement",
      "/api/member": "member",
      "/api/person": "person",
      "/api/person-members": "personMembers",
      "/api/initial-balances": "initialBalances",
      "/api/payment": "payment",
      "/api/cementerios": "cementerios",
      "/api/dues": "dues",
      "/api/dues-config": "duesConfig",
      "/api/services": "services",
      "/api/service-records": "serviceRecords",
      "/api/cementerio-movimientos": "cementerioMovimientos",
      "/api/users": "users",
      "/api/debts": "debts",
      "/api/debts/balance": "debtsBalance",
      "/api/external-services": "externalServices",
      "/api/external-service-payments": "externalServicePayments",
    };

    const route = routes[pathname];
    if (!route) { next(); return; }

    try {
      res.setHeader("Content-Type", "application/json");

      if (route === "members" && req.method === "GET") {
        res.json(await getAllMembers()); return;
      }

      if (route === "membersFamily" && req.method === "GET") {
        const memberId = url.searchParams.get("memberId");
        if (!memberId) { res.status(400).json({ error: "Falta el parámetro memberId" }); return; }
        res.json(await getFamilyMembers(memberId)); return;
      }

      if (route === "membersDebt" && req.method === "GET") {
        const [members, config] = await Promise.all([getMembersDebtStatus(), getDuesConfig()]);
        res.json({ members, consideration_years: config?.consideration_years ?? 0 }); return;
      }

      if (route === "persons" && req.method === "GET") {
        const q = url.searchParams.get("q") || "";
        res.json(q ? await searchPersons(q) : await getAllPersons()); return;
      }

      if (route === "movement") {
        const id = url.searchParams.get("id") ?? undefined;
        if (req.method === "GET") {
          if (!id) { res.status(400).json({ error: "Falta el parámetro id" }); return; }
          const movement = await getMovementById(id);
          if (!movement) { res.status(404).json({ error: "Movimiento no encontrado" }); return; }
          const [due, serviceRecords, cementerioMovimientos] = await Promise.all([
            getDueByMovementId(id), getServiceRecordsByMovement(id), getCementerioMovimientosByMovement(id),
          ]);
          res.json({ ...movement, linked_due: due, linked_service_records: serviceRecords, linked_cementerio_movimientos: cementerioMovimientos }); return;
        }
        if (req.method === "PUT") {
          if (!id) { res.status(400).json({ error: "Falta el parámetro id" }); return; }
          const body = JSON.parse(await collectBody(req));
          const { due: dueData, ...movementData } = body;
          await updateMovement(id, movementData);
          if (dueData) await updateDueByMovementId(id, dueData);
          res.json({ success: true }); return;
        }
        if (req.method === "DELETE") {
          if (!id) { res.status(400).json({ error: "Falta el parámetro id" }); return; }
          await reverseDebtsByMovementId(id);
          await deleteDueByMovementId(id);
          await deleteServiceRecordsByMovement(id);
          await deleteCementerioMovimientosByMovement(id);
          await deletePaymentsByMovementId(id);
          await deleteMovement(id);
          res.json({ success: true }); return;
        }
      }

      if (route === "movements" && req.method === "GET") {
        res.json(await getAllMovements()); return;
      }

      if (route === "initialBalances") {
        if (req.method === "GET") { res.json(await getInitialBalances()); return; }
        if (req.method === "POST") {
          const { caja_chica, banco } = JSON.parse(await collectBody(req));
          res.json(await upsertInitialBalances(caja_chica, banco)); return;
        }
      }

      if (route === "member") {
        if (req.method === "GET") {
          const id = url.searchParams.get("id");
          if (!id) { res.status(400).json({ error: "Falta el parámetro id" }); return; }
          const member = await getMemberById(id);
          if (!member) { res.status(404).json({ error: "Socio no encontrado" }); return; }
          res.json(member); return;
        }
        if (req.method === "POST") {
          const member = JSON.parse(await collectBody(req));
          if (!member?.numeroDeSocio) { res.status(400).json({ error: "Falta el número de socio" }); return; }
          await upsertMember(member);
          res.json({ success: true }); return;
        }
        if (req.method === "DELETE") {
          const id = url.searchParams.get("id");
          if (!id) { res.status(400).json({ error: "Falta el parámetro id" }); return; }
          await deleteMemberById(id);
          res.json({ success: true }); return;
        }
      }

      if (route === "person") {
        if (req.method === "GET") {
          const id = url.searchParams.get("id");
          if (!id) { res.status(400).json({ error: "Falta el parámetro id" }); return; }
          const person = await getPersonById(id);
          if (!person) { res.status(404).json({ error: "Persona no encontrada" }); return; }
          res.json(person); return;
        }
        if (req.method === "POST") {
          const person = JSON.parse(await collectBody(req));
          if (!person?.nombre?.trim()) { res.status(400).json({ error: "Falta el nombre de la persona" }); return; }
          await upsertPerson(person);
          res.json({ success: true }); return;
        }
        if (req.method === "DELETE") {
          const id = url.searchParams.get("id");
          if (!id) { res.status(400).json({ error: "Falta el parámetro id" }); return; }
          await deletePersonById(id);
          res.json({ success: true }); return;
        }
      }

      if (route === "payment" && req.method === "POST") {
        const payment = JSON.parse(await collectBody(req));
        if (!payment?.date || payment?.amount == null) { res.status(400).json({ error: "Faltan datos requeridos" }); return; }
        const movementId = await insertMovement({
          date: payment.date, detail: payment.detail, amount: payment.amount,
          type: payment.type || "ingreso", mode: payment.mode, concept: payment.concept ?? null,
        });
        res.json({ success: true, id: movementId }); return;
      }

      if (route === "cementerios") {
        if (req.method === "GET") {
          const ownerId = url.searchParams.get("ownerId");
          const isSocio = url.searchParams.get("isSocio") === "true";
          const nicho = url.searchParams.get("nicho");
          const ownersOnly = url.searchParams.get("owners") === "true";
          if (ownersOnly) { res.json(await getCementerioOwnerIds()); return; }
          if (ownerId) { res.json(await getCementeriosByOwnerId(ownerId, isSocio)); return; }
          if (nicho) { res.json(await getCementeriosByNicho(nicho)); return; }
          res.json(await getAllCementeriosGrid()); return;
        }
        if (req.method === "PATCH") {
          const id = url.searchParams.get("id");
          if (!id) { res.status(400).json({ error: "Falta el parámetro id" }); return; }
          await updateCementerio(id, JSON.parse(await collectBody(req)));
          res.json({ success: true }); return;
        }
      }

      if (route === "personMembers" && req.method === "GET") {
        const personId = url.searchParams.get("personId");
        if (!personId) { res.status(400).json({ error: "Falta el parámetro personId" }); return; }
        res.json(await getMembersByPersonId(personId)); return;
      }

      if (route === "dues") {
        if (req.method === "GET") {
          const memberId = url.searchParams.get("memberId");
          const personId = url.searchParams.get("personId");
          const check = url.searchParams.get("check");
          if (memberId && check === "cementerio") { res.json(await getDuesByMemberWithCemeteryCheck(memberId)); return; }
          if (memberId) { res.json(await getDuesByMember(memberId)); return; }
          if (personId) { res.json(await getDuesByPerson(personId)); return; }
          res.json(await getAllDues()); return;
        }
        if (req.method === "POST") {
          const body = JSON.parse(await collectBody(req));
          if (!body?.type || !body?.payment_date) { res.status(400).json({ error: "Faltan datos requeridos" }); return; }
          const id = await insertDue({
            type: body.type, payment_date: body.payment_date, period: body.period ?? null,
            member_id: body.member_id ?? null, person_id: body.person_id ?? null,
            movement_id: body.movement_id ?? null, family_group: body.family_group ?? null,
            paid_members: body.paid_members ?? null,
          });
          res.json({ success: true, id }); return;
        }
      }

      if (route === "duesConfig") {
        if (req.method === "GET") { res.json(await getDuesConfig()); return; }
        if (req.method === "POST") {
          const body = JSON.parse(await collectBody(req));
          if (body.member_fee === undefined) { res.status(400).json({ error: "Falta parámetro member_fee" }); return; }
          res.json(await upsertDuesConfig(
            body.member_fee, body.consideration_years ?? 0,
            body.nicho_member_fee ?? 0, body.nicho_non_member_fee ?? 0,
            body.urna_member_fee ?? 0, body.urna_non_member_fee ?? 0,
            body.bolsa_member_fee ?? 0, body.bolsa_non_member_fee ?? 0,
            body.asistencial_fee ?? 0, body.plan_salud_fee ?? 0,
            body.fee_act ?? 0, body.fee_act_a ?? 0, body.fee_adh ?? 0, body.fee_part ?? 0, body.fee_vit ?? 0,
          )); return;
        }
      }

      if (route === "services") {
        if (req.method === "GET") { res.json(await getAllServices()); return; }
        if (req.method === "POST") {
          const body = JSON.parse(await collectBody(req));
          if (!body?.name?.trim()) { res.status(400).json({ error: "Falta el name del servicio" }); return; }
          res.json(await insertService(body.name.trim(), body.amount ?? 0)); return;
        }
        if (req.method === "PUT") {
          const body = JSON.parse(await collectBody(req));
          if (!body?.id || !body?.name?.trim()) { res.status(400).json({ error: "Faltan parámetros" }); return; }
          const result = await updateService(body.id, body.name.trim(), body.amount ?? 0);
          if (!result) { res.status(404).json({ error: "Servicio no encontrado" }); return; }
          res.json(result); return;
        }
        if (req.method === "DELETE") {
          const id = url.searchParams.get("id");
          if (!id) { res.status(400).json({ error: "Falta el parámetro id" }); return; }
          await deleteService(id);
          res.json({ success: true }); return;
        }
      }

      if (route === "serviceRecords") {
        if (req.method === "GET") {
          const id = url.searchParams.get("id");
          const memberId = url.searchParams.get("memberId");
          const personId = url.searchParams.get("personId");
          const movementId = url.searchParams.get("movementId");
          if (id) { const r = await getServiceRecordById(id); if (!r) { res.status(404).json({ error: "No encontrado" }); return; } res.json(r); return; }
          if (memberId) { res.json(await getServiceRecordsByMember(memberId)); return; }
          if (personId) { res.json(await getServiceRecordsByPerson(personId)); return; }
          if (movementId) { res.json(await getServiceRecordsByMovement(movementId)); return; }
          res.json(await getAllServiceRecords()); return;
        }
        if (req.method === "POST") {
          const body = JSON.parse(await collectBody(req));
          if (!body.service_id || !body.date) { res.status(400).json({ error: "Faltan parámetros requeridos" }); return; }
          if (!body.member_id && !body.person_id) { res.status(400).json({ error: "Se requiere member_id o person_id" }); return; }
          res.json(await insertServiceRecord({ ...body, member_id: body.member_id ?? null, person_id: body.person_id ?? null, movement_id: body.movement_id ?? null, service_date: body.service_date ?? null, detail: body.detail ?? null })); return;
        }
        if (req.method === "PUT") {
          const body = JSON.parse(await collectBody(req));
          if (!body.id) { res.status(400).json({ error: "Falta el parámetro id" }); return; }
          const result = await updateServiceRecord(body.id, { ...body, member_id: body.member_id ?? null, person_id: body.person_id ?? null, movement_id: body.movement_id ?? null, service_date: body.service_date ?? null, detail: body.detail ?? null });
          if (!result) { res.status(404).json({ error: "No encontrado" }); return; }
          res.json(result); return;
        }
        if (req.method === "DELETE") {
          const id = url.searchParams.get("id");
          if (!id) { res.status(400).json({ error: "Falta el parámetro id" }); return; }
          await deleteServiceRecord(id);
          res.json({ success: true }); return;
        }
      }

      if (route === "users") {
        if (req.method === "GET") { res.json(await getAllAppUsers()); return; }
        if (req.method === "POST") {
          const body = JSON.parse(await collectBody(req));
          if (!body.auth_user_id || !body.email) { res.status(400).json({ error: "Faltan campos" }); return; }
          res.json(await upsertAppUser(body.auth_user_id, body.email, body.name ?? null, body.role ?? "secretario")); return;
        }
        if (req.method === "PATCH") {
          const body = JSON.parse(await collectBody(req));
          if (!body.auth_user_id || !body.role) { res.status(400).json({ error: "Faltan campos" }); return; }
          const user = await updateAppUserRole(body.auth_user_id, body.role);
          if (!user) { res.status(404).json({ error: "No encontrado" }); return; }
          res.json(user); return;
        }
        if (req.method === "DELETE") {
          const authUserId = url.searchParams.get("auth_user_id");
          if (!authUserId) { res.status(400).json({ error: "Falta auth_user_id" }); return; }
          await deleteAppUser(authUserId);
          res.json({ success: true }); return;
        }
      }

      if (route === "vitalicios" && req.method === "PATCH") {
        res.json({ updated: await updateVitalicios() }); return;
      }

      if (route === "cementerioMovimientos") {
        if (req.method === "GET") {
          const movementId = url.searchParams.get("movementId");
          const nicho = url.searchParams.get("nicho");
          const hasNicho = url.searchParams.get("hasNicho");
          const pagosMap = url.searchParams.get("pagosMap") === "true";
          const memberId = url.searchParams.get("memberId");
          const personId = url.searchParams.get("personId");
          if (pagosMap) { res.json(await getCementerioPagosMap()); return; }
          if (hasNicho) { res.json({ exists: await hasCementerioMovimientosByNicho(hasNicho) }); return; }
          if (movementId) { res.json(await getCementerioMovimientosByMovement(movementId)); return; }
          if (nicho) { res.json((memberId || personId) ? await getCementerioMovimientosByNichoAndArrendatario(nicho, memberId, personId) : await getCementerioMovimientosByNicho(nicho)); return; }
          res.status(400).json({ error: "Falta el parámetro" }); return;
        }
        if (req.method === "POST") {
          const body = JSON.parse(await collectBody(req));
          if (!body?.movement_id || !body?.nicho || !body?.fecha_pago) { res.status(400).json({ error: "Faltan datos requeridos" }); return; }
          const id = await insertCementerioMovimiento({ ...body, cementerio_id: body.cementerio_id ?? null, tipo: body.tipo ?? null, ocupante: body.ocupante ?? null, anios_pagados: body.anios_pagados ?? [], member_id: body.member_id ?? null, person_id: body.person_id ?? null });
          res.json({ success: true, id }); return;
        }
      }

      if (route === "debts") {
        if (req.method === "GET") {
          const memberId = url.searchParams.get("memberId");
          const personId = url.searchParams.get("personId");
          if (memberId) { res.json(await getDebtsByMember(memberId)); return; }
          if (personId) { res.json(await getDebtsByPerson(personId)); return; }
          res.status(400).json({ error: "Falta memberId o personId" }); return;
        }
        if (req.method === "POST") {
          const body = JSON.parse(await collectBody(req));
          if (!body?.type || body.amount === undefined || !body?.date) { res.status(400).json({ error: "Faltan datos requeridos" }); return; }
          if (!body.member_id && !body.person_id) { res.status(400).json({ error: "Se requiere member_id o person_id" }); return; }
          const id = await insertDebt({ ...body, member_id: body.member_id ?? null, person_id: body.person_id ?? null, description: body.description ?? null, movement_id: body.movement_id ?? null });
          res.json({ success: true, id }); return;
        }
      }

      if (route === "debtsBalance" && req.method === "GET") {
        const memberId = url.searchParams.get("memberId");
        const personId = url.searchParams.get("personId");
        if (memberId) { res.json({ balance: await getBalanceByMember(memberId) }); return; }
        if (personId) { res.json({ balance: await getBalanceByPerson(personId) }); return; }
        res.status(400).json({ error: "Falta memberId o personId" }); return;
      }

      if (route === "externalServices") {
        if (req.method === "GET") { res.json(await getAllExternalServices()); return; }
        if (req.method === "POST") {
          const body = JSON.parse(await collectBody(req));
          if (!body.name?.trim()) { res.status(400).json({ error: "Falta el nombre" }); return; }
          res.status(201).json(await insertExternalService(body.name.trim(), body.phone ?? null, body.description ?? null, body.frequency ?? "mensual", body.start_month ?? null)); return;
        }
        if (req.method === "PUT") {
          const body = JSON.parse(await collectBody(req));
          if (!body.id || !body.name?.trim()) { res.status(400).json({ error: "Faltan campos" }); return; }
          const row = await updateExternalService(body.id, body.name.trim(), body.phone ?? null, body.description ?? null, body.frequency ?? "mensual", body.start_month ?? null, body.active);
          if (!row) { res.status(404).json({ error: "No encontrado" }); return; }
          res.json(row); return;
        }
        if (req.method === "DELETE") {
          const id = url.searchParams.get("id");
          if (!id) { res.status(400).json({ error: "Falta el id" }); return; }
          await deleteExternalService(id);
          res.json({ success: true }); return;
        }
      }

      if (route === "externalServicePayments") {
        if (req.method === "GET") {
          const year = parseInt(url.searchParams.get("year") ?? "", 10);
          if (isNaN(year)) { res.status(400).json({ error: "Falta el año" }); return; }
          res.json(await getPaymentsByYear(year)); return;
        }
        if (req.method === "POST") {
          const body = JSON.parse(await collectBody(req));
          if (!body.service_id || !body.month || !body.year) { res.status(400).json({ error: "Faltan campos" }); return; }
          res.json(await upsertPayment(body.service_id, body.month, body.year, body.amount ?? null, body.movement_id ?? null)); return;
        }
        if (req.method === "DELETE") {
          const body = JSON.parse(await collectBody(req));
          if (!body.service_id || !body.month || !body.year) { res.status(400).json({ error: "Faltan campos" }); return; }
          await deletePayment(body.service_id, body.month, body.year);
          res.json({ success: true }); return;
        }
      }

      next();
    } catch (error) {
      console.error(`API ${req.url}:`, error);
      res.status(500).json({ error: "No se pudieron cargar los datos desde la base de datos" });
    }
  });

  server.use(express.static(path.join(__dirname, "..", "dist")));
  server.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`API server running on http://localhost:${port}`);
      resolve();
    });
  });
}
