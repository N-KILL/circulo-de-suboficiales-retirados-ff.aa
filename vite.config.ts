import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function apiDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: "api-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const isMembers = req.url === "/api/members";
        const isMovements = req.url === "/api/movements";

        if ((!isMembers && !isMovements) || req.method !== "GET") {
          next();
          return;
        }

        try {
          if (!process.env.DATABASE_URL && env.DATABASE_URL) {
            process.env.DATABASE_URL = env.DATABASE_URL;
          }

          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;

          if (isMembers) {
            const { getAllMembers } = await import("./src/database/membersRepository");
            const members = await getAllMembers();
            res.end(JSON.stringify(members));
          } else {
            const { getAllMovements } = await import("./src/database/pettyCashRepository");
            const movements = await getAllMovements();
            res.end(JSON.stringify(movements));
          }
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
