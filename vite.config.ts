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
        const isMovements = pathname === "/api/movements";
        const isMember = pathname === "/api/member";

        if (!isMembers && !isMovements && !isMember) {
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

          if (isMovements && req.method === "GET") {
            const { getAllMovements } = await import("./src/database/pettyCashRepository");
            const movements = await getAllMovements();
            res.statusCode = 200;
            res.end(JSON.stringify(movements));
            return;
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

          if (isMember && req.method === "OPTIONS") {
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
