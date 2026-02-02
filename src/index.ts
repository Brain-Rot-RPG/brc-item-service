import express, { Express, Request, Response } from "express";
import { Pool, QueryResult } from "pg";
import { v4 as uuidv4 } from "uuid";

const PORT = process.env.PORT || 4009;

interface Item {
  id: string;
  name: string;
  effect: Record<string, number>;
  price: number;
  created_at: Date;
}

interface ItemInput {
  name: string;
  effect: Record<string, number>;
  price: number;
}

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  database: process.env.PGDATABASE || "brc_item",
  user: process.env.PGUSER || "brc_item_user",
  password: process.env.PGPASSWORD || "brc_item_password",
});

const app: Express = express();
app.use(express.json());

app.get("/api/v1/item", async (req: Request, res: Response): Promise<void> => {
  try {
    const result: QueryResult<{ id: string; name: string; effect: string; price: number; created_at: Date }> = await pool.query(
      "SELECT * FROM items"
    );
    const items = result.rows.map((row) => ({
      ...row,
      effect: typeof row.effect === "string" ? JSON.parse(row.effect) : row.effect,
    }));
    res.status(200).json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get(
  "/api/v1/item/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result: QueryResult<{ id: string; name: string; effect: string; price: number; created_at: Date }> = await pool.query(
        "SELECT * FROM items WHERE id = $1",
        [id]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ message: "Item not found" });
        return;
      }

      const row = result.rows[0];
      res.status(200).json({
        ...row,
        effect: typeof row.effect === "string" ? JSON.parse(row.effect) : row.effect,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.post("/api/v1/item", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, effect, price } = req.body as ItemInput;

    if (!name || !effect || typeof effect !== "object" || price === undefined) {
      res.status(400).json({ message: "Missing required fields or invalid effect format" });
      return;
    }

    const id = uuidv4();
    await pool.query(
      "INSERT INTO items (id, name, effect, price) VALUES ($1, $2, $3, $4)",
      [id, name, JSON.stringify(effect), price]
    );

    res.status(201).json({ id, name, effect, price });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.put(
  "/api/v1/item/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, effect, price } = req.body as ItemInput;

      if (!name || !effect || typeof effect !== "object" || price === undefined) {
        res.status(400).json({ message: "Missing required fields or invalid effect format" });
        return;
      }

      const result: QueryResult<{ id: string; name: string; effect: string; price: number; created_at: Date }> = await pool.query(
        "UPDATE items SET name = $2, effect = $3, price = $4 WHERE id = $1 RETURNING *",
        [id, name, JSON.stringify(effect), price]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ message: "Item not found" });
        return;
      }

      const row = result.rows[0];
      res.status(200).json({
        ...row,
        effect: typeof row.effect === "string" ? JSON.parse(row.effect) : row.effect,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.delete(
  "/api/v1/item/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result: QueryResult<Item> = await pool.query(
        "DELETE FROM items WHERE id = $1",
        [id]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ message: "Item not found" });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Item service listening on port ${PORT}`);
});
