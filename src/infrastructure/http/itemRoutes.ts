import { Router, Request, Response } from "express";
import { ItemService } from "../../application/services/ItemService";

export const createItemRouter = (service: ItemService): Router => {
  const router = Router();

  router.get("/item", async (_req: Request, res: Response) => {
    try {
      const result = await service.getAll();
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.get("/item/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await service.getById(id);

      if (!result) {
        res.status(404).json({ message: "Item not found" });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.post("/item", async (req: Request, res: Response) => {
    try {
      const { name, effect, price } = req.body;

      if (!name || !effect || typeof effect !== "object" || price === undefined) {
        res.status(400).json({ message: "Missing required fields or invalid effect format" });
        return;
      }

      const result = await service.create({ name, effect, price });
      res.status(201).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.put("/item/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, effect, price } = req.body;

      if (!name || !effect || typeof effect !== "object" || price === undefined) {
        res.status(400).json({ message: "Missing required fields or invalid effect format" });
        return;
      }

      const result = await service.update(id, { name, effect, price });

      if (!result) {
        res.status(404).json({ message: "Item not found" });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.delete("/item/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const deleted = await service.delete(id);

      if (!deleted) {
        res.status(404).json({ message: "Item not found" });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return router;
};
