import { Pool } from "pg";
import { PostgresItemRepository } from "./infrastructure/database/PostgresItemRepository";
import { ItemService } from "./application/services/ItemService";
import { createApp } from "./infrastructure/http/app";

const PORT = process.env.PORT || 4009;

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  database: process.env.PGDATABASE || "brc_item",
  user: process.env.PGUSER || "brc_item_user",
  password: process.env.PGPASSWORD || "brc_item_password",
});

const repository = new PostgresItemRepository(pool);
const service = new ItemService(repository);
const app = createApp(service);

app.listen(PORT, () => {
  console.log(`Item service listening on port ${PORT}`);
});
