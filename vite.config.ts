import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage } from "http";

function collectBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

function apiDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: "api-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "", "http://localhost");
        const pathname = url.pathname;
        const isMembers = pathname === "/api/members";
        const isMembersFamily = pathname === "/api/members/family";
        const isPersons = pathname === "/api/persons";
        const isMovements = pathname === "/api/movements";
        const isMovement = pathname === "/api/movement";
        const isMember = pathname === "/api/member";
        const isPerson = pathname === "/api/person";
        const isPersonMembers = pathname === "/api/person-members";
        const isInitialBalances = pathname === "/api/initial-balances";
        const isPayment = pathname === "/api/payment";
        const isCementerios = pathname === "/api/cementerios";
        const isDues = pathname === "/api/dues";
        const isDuesConfig = pathname === "/api/dues-config";
        const isServices = pathname === "/api/services";

        if (!isMembers && !isMembersFamily && !isPersons && !isMovements && !isMovement && !isMember && !isPerson && !isPersonMembers && !isInitialBalances && !isPayment && !isCementerios && !isDues && !isDuesConfig && !isServices) {
          next();
          return;
        }

        try {
          if (!process.env.DATABASE_URL && env.DATABASE_URL) {
            process.env.DATABASE_URL = env.DATABASE_URL;
          }

          res.setHeader("Content-Type", "application/json");

          if (isMembers && req.method === "GET") {
            const { getAllMembers } = await import("./src/database/membersRepository");
            const members = await getAllMembers();
            res.statusCode = 200;
            res.end(JSON.stringify(members));
            return;
          }

          if (isMembersFamily && req.method === "GET") {
            const memberId = url.searchParams.get("memberId");
            if (!memberId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Falta el parámetro memberId" }));
              return;
            }
            const { getFamilyMembers } = await import("./src/database/membersRepository");
            const members = await getFamilyMembers(memberId);
            res.statusCode = 200;
            res.end(JSON.stringify(members));
            return;
          }

          if (isPersons && req.method === "GET") {
            const q = url.searchParams.get("q") || "";
            if (q) {
              const { searchPersons } = await import("./src/database/membersRepository");
              const persons = await searchPersons(q);
              res.statusCode = 200;
              res.end(JSON.stringify(persons));
            } else {
              const { getAllPersons } = await import("./src/database/personsRepository");
              const persons = await getAllPersons();
              res.statusCode = 200;
              res.end(JSON.stringify(persons));
            }
            return;
          }

          if (isMovement) {
            const { getMovementById, updateMovement, deleteMovement } = await import("./src/database/pettyCashRepository");
            const { getDueByMovementId, deleteDueByMovementId, updateDueByMovementId } = await import("./src/database/duesRepository");
            const id = url.searchParams.get("id") ?? undefined;

            if (req.method === "GET") {
              if (!id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Falta el parámetro id" }));
                return;
              }
              const movement = await getMovementById(id);
              if (!movement) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: "Movimiento no encontrado" }));
                return;
              }
              const due = await getDueByMovementId(id);
              res.statusCode = 200;
              res.end(JSON.stringify({ ...movement, linked_due: due }));
              return;
            }

            if (req.method === "PUT") {
              if (!id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Falta el parámetro id" }));
                return;
              }
              const body = JSON.parse(await collectBody(req));
              const { due: dueData, ...movementData } = body;
              await updateMovement(id, movementData);
              if (dueData) {
                await updateDueByMovementId(id, dueData);
              }
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
              return;
            }

            if (req.method === "DELETE") {
              if (!id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Falta el parámetro id" }));
                return;
              }
              await deleteDueByMovementId(id);
              await deleteMovement(id);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
              return;
            }

            if (req.method === "OPTIONS") {
              res.statusCode = 204;
              res.end();
              return;
            }

            res.statusCode = 405;
            res.end(JSON.stringify({ error: "Método no permitido" }));
            return;
          }

          if (isMovements && req.method === "GET") {
            const { getAllMovements } = await import("./src/database/pettyCashRepository");
            const movements = await getAllMovements();
            res.statusCode = 200;
            res.end(JSON.stringify(movements));
            return;
          }

          if (isInitialBalances) {
            if (req.method === "GET") {
              const { getInitialBalances } = await import("./src/database/initialBalancesRepository");
              const balances = await getInitialBalances();
              res.statusCode = 200;
              res.end(JSON.stringify(balances));
              return;
            }
            if (req.method === "POST") {
              const body = await collectBody(req);
              const { caja_chica, banco } = JSON.parse(body);
              const { upsertInitialBalances } = await import("./src/database/initialBalancesRepository");
              const result = await upsertInitialBalances(caja_chica, banco);
              res.statusCode = 200;
              res.end(JSON.stringify(result));
              return;
            }
            if (req.method === "OPTIONS") {
              res.statusCode = 204;
              res.end();
              return;
            }
          }

          if (isMember && req.method === "GET") {
            const id = url.searchParams.get("id");
            if (!id) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Falta el parámetro id" }));
              return;
            }
            const { getMemberById } = await import("./src/database/membersRepository");
            const member = await getMemberById(id);
            if (!member) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "Socio no encontrado" }));
              return;
            }
            res.statusCode = 200;
            res.end(JSON.stringify(member));
            return;
          }

          if (isPayment && req.method === "POST") {
            const body = await collectBody(req);
            const payment = JSON.parse(body);
            if (!payment?.date || !payment?.amount) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Faltan datos requeridos" }));
              return;
            }
            const { insertMovement } = await import("./src/database/pettyCashRepository");
            const movementId = await insertMovement({
              date: payment.date,
              detail: payment.detail,
              amount: payment.amount,
              type: "ingreso",
              mode: payment.mode,
              concept: payment.concept ?? null,
            });
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, id: movementId }));
            return;
          }

          if (isPayment && req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }

          if (isMember && req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }

          if (isPerson && req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }

          if (isMember && req.method === "POST") {
            const body = await collectBody(req);
            const member = JSON.parse(body);
            if (!member?.numeroDeSocio) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Falta el número de socio" }));
              return;
            }
            const { upsertMember } = await import("./src/database/membersRepository");
            await upsertMember(member);
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
            return;
          }

          if (isMember && req.method === "DELETE") {
            const id = url.searchParams.get("id");
            if (!id) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Falta el parámetro id" }));
              return;
            }
            const { deleteMemberById } = await import("./src/database/membersRepository");
            await deleteMemberById(id);
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
            return;
          }

          if (isPerson && req.method === "GET") {
            const id = url.searchParams.get("id");
            if (!id) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Falta el parámetro id" }));
              return;
            }
            const { getPersonById } = await import("./src/database/personsRepository");
            const person = await getPersonById(id);
            if (!person) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "Persona no encontrada" }));
              return;
            }
            res.statusCode = 200;
            res.end(JSON.stringify(person));
            return;
          }

          if (isPerson && req.method === "POST") {
            const body = await collectBody(req);
            const person = JSON.parse(body);
            if (!person?.nombre?.trim()) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Falta el nombre de la persona" }));
              return;
            }
            const { upsertPerson } = await import("./src/database/personsRepository");
            await upsertPerson(person);
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
            return;
          }

          if (isPerson && req.method === "DELETE") {
            const id = url.searchParams.get("id");
            if (!id) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Falta el parámetro id" }));
              return;
            }
            const { deletePersonById } = await import("./src/database/personsRepository");
            await deletePersonById(id);
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
            return;
          }

          if (isCementerios) {
            const { getAllCementeriosGrid, getCementeriosByNicho, updateCementerio } = await import("./src/database/cementeriosRepository");

            if (req.method === "GET") {
              const nicho = url.searchParams.get("nicho");
              if (nicho) {
                const items = await getCementeriosByNicho(nicho);
                res.statusCode = 200;
                res.end(JSON.stringify(items));
              } else {
                const items = await getAllCementeriosGrid();
                res.statusCode = 200;
                res.end(JSON.stringify(items));
              }
              return;
            }

            if (req.method === "PATCH") {
              const id = url.searchParams.get("id");
              if (!id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Falta el parámetro id" }));
                return;
              }
              const body = await collectBody(req);
              const data = JSON.parse(body);
              await updateCementerio(id, data);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
              return;
            }

            if (req.method === "OPTIONS") {
              res.statusCode = 204;
              res.end();
              return;
            }
          }

          if (isPersonMembers && req.method === "GET") {
            const personId = url.searchParams.get("personId");
            if (!personId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Falta el parámetro personId" }));
              return;
            }
            const { getMembersByPersonId } = await import("./src/database/personsRepository");
            const members = await getMembersByPersonId(personId);
            res.statusCode = 200;
            res.end(JSON.stringify(members));
            return;
          }

          if (isDues) {
            const {
              getAllDues,
              getDuesByMember,
              getDuesByPerson,
              insertDue,
              getDuesByMemberWithCemeteryCheck,
            } = await import("./src/database/duesRepository");

            if (req.method === "GET") {
              const memberId = url.searchParams.get("memberId");
              const personId = url.searchParams.get("personId");
              const check = url.searchParams.get("check");

              if (memberId && check === "cementerio") {
                const result = await getDuesByMemberWithCemeteryCheck(memberId);
                res.statusCode = 200;
                res.end(JSON.stringify(result));
                return;
              }

              if (memberId) {
                const dues = await getDuesByMember(memberId);
                res.statusCode = 200;
                res.end(JSON.stringify(dues));
                return;
              }

              if (personId) {
                const dues = await getDuesByPerson(personId);
                res.statusCode = 200;
                res.end(JSON.stringify(dues));
                return;
              }

              const all = await getAllDues();
              res.statusCode = 200;
              res.end(JSON.stringify(all));
              return;
            }

            if (req.method === "POST") {
              const body = JSON.parse(await collectBody(req));
              if (!body?.type || !body?.payment_date) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Faltan datos requeridos (type, payment_date)" }));
                return;
              }
              const id = await insertDue({
                type: body.type,
                payment_date: body.payment_date,
                period_start: body.period_start ?? null,
                period_end: body.period_end ?? null,
                member_id: body.member_id ?? null,
                person_id: body.person_id ?? null,
                movement_id: body.movement_id ?? null,
                family_group: body.family_group ?? null,
                paid_members: body.paid_members ?? null,
              });
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, id }));
              return;
            }

            if (req.method === "OPTIONS") {
              res.statusCode = 204;
              res.end();
              return;
            }

            res.statusCode = 405;
            res.end(JSON.stringify({ error: "Método no permitido" }));
            return;
          }

          if (isDuesConfig) {
            if (req.method === "GET") {
              const { getDuesConfig } = await import("./src/database/duesConfigRepository");
              const config = await getDuesConfig();
              res.statusCode = 200;
              res.end(JSON.stringify(config));
              return;
            }
            if (req.method === "POST") {
              const body = JSON.parse(await collectBody(req));
              const { member_fee, cemetery_fee } = body;
              if (member_fee === undefined || cemetery_fee === undefined) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Faltan parámetros member_fee y/o cemetery_fee" }));
                return;
              }
              const { upsertDuesConfig } = await import("./src/database/duesConfigRepository");
              const result = await upsertDuesConfig(member_fee, cemetery_fee);
              res.statusCode = 200;
              res.end(JSON.stringify(result));
              return;
            }
            if (req.method === "OPTIONS") {
              res.statusCode = 204;
              res.end();
              return;
            }
            res.statusCode = 405;
            res.end(JSON.stringify({ error: "Método no permitido" }));
            return;
          }

          if (isServices) {
            const { getAllServices, insertService, updateService, deleteService } = await import("./src/database/servicesRepository");
            if (req.method === "GET") {
              const services = await getAllServices();
              res.statusCode = 200;
              res.end(JSON.stringify(services));
              return;
            }
            if (req.method === "POST") {
              const body = JSON.parse(await collectBody(req));
              if (!body?.name?.trim()) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Falta el name del servicio" }));
                return;
              }
              const result = await insertService(body.name.trim(), body.amount ?? 0);
              res.statusCode = 200;
              res.end(JSON.stringify(result));
              return;
            }
            if (req.method === "PUT") {
              const body = JSON.parse(await collectBody(req));
              if (!body?.id || !body?.name?.trim()) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Faltan parámetros id y/o name" }));
                return;
              }
              const result = await updateService(body.id, body.name.trim(), body.amount ?? 0);
              if (!result) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: "Servicio no encontrado" }));
                return;
              }
              res.statusCode = 200;
              res.end(JSON.stringify(result));
              return;
            }
            if (req.method === "DELETE") {
              const id = url.searchParams.get("id");
              if (!id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Falta el parámetro id" }));
                return;
              }
              await deleteService(id);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
              return;
            }
            if (req.method === "OPTIONS") {
              res.statusCode = 204;
              res.end();
              return;
            }
            res.statusCode = 405;
            res.end(JSON.stringify({ error: "Método no permitido" }));
            return;
          }

          next();
        } catch (error) {
          console.error(`API ${req.url}:`, error);
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              error: "No se pudieron cargar los datos desde la base de datos",
            })
          );
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), apiDevPlugin(env)],
  };
});
