import express, { Express } from "express";
import { ItemService } from "../../application/services/ItemService";
import { createItemRouter } from "./itemRoutes";

export const createApp = (service: ItemService): Express => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1", createItemRouter(service));
  return app;
};
