import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Request, Response } from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { authenticateToken } from "./services/auth.js";
import { typeDefs, resolvers } from "./schemas/index.js";
import db from "./config/connection.js";

// Fix __dirname in ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const app = express();

const startApolloServer = async () => {
  await server.start();
  await db;

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.use(
    "/graphql",
    expressMiddleware(server as any, {
      context: authenticateToken as any,
    })
  );

  // Serve static files from frontend in production
  if (process.env.NODE_ENV === "production") {
    // Fixed: correct path for Render deployment
    const clientDistPath = path.resolve(__dirname, "../../client/dist");
    app.use(express.static(clientDistPath));

    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🚀 GraphQL ready at http://localhost:${PORT}/graphql`);
  });
};

startApolloServer();
