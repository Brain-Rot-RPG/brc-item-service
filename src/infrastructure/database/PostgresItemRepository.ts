import { Pool, QueryResult } from "pg";
import { v4 as uuidv4 } from "uuid";
import { Item } from "../../domain/entities/Item";
import { ItemRepository } from "../../domain/repositories/ItemRepository";

interface ItemRow {
  id: string;
  name: string;
  effect: string;
  price: number;
  created_at: Date;
}

export class PostgresItemRepository implements ItemRepository {
  constructor(private readonly pool: Pool) {}

  async getAll(): Promise<Item[]> {
    const result: QueryResult<ItemRow> = await this.pool.query(
      "SELECT * FROM items ORDER BY created_at DESC"
    );
    return result.rows.map(this.mapRow);
  }

  async getById(id: string): Promise<Item | null> {
    const result: QueryResult<ItemRow> = await this.pool.query(
      "SELECT * FROM items WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRow(result.rows[0]);
  }

  async create(input: Omit<Item, "id" | "createdAt">): Promise<Item> {
    const id = uuidv4();
    const result: QueryResult<ItemRow> = await this.pool.query(
      "INSERT INTO items (id, name, effect, price) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, input.name, JSON.stringify(input.effect), input.price]
    );

    return this.mapRow(result.rows[0]);
  }

  async update(
    id: string,
    input: Omit<Item, "id" | "createdAt">
  ): Promise<Item | null> {
    const result: QueryResult<ItemRow> = await this.pool.query(
      "UPDATE items SET name = $2, effect = $3, price = $4 WHERE id = $1 RETURNING *",
      [id, input.name, JSON.stringify(input.effect), input.price]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRow(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM items WHERE id = $1", [
      id,
    ]);
    return result.rowCount > 0;
  }

  private mapRow(row: ItemRow): Item {
    return {
      id: row.id,
      name: row.name,
      effect: JSON.parse(row.effect),
      price: row.price,
      createdAt: row.created_at,
    };
  }
}
