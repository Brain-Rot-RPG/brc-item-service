import { Pool, QueryResult } from "pg";
import { Item } from "../../domain/entities/Item";
import { ItemRepository } from "../../domain/repositories/ItemRepository";

interface ItemRow {
  id: number;
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

  async getById(id: number): Promise<Item | null> {
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
    const result: QueryResult<ItemRow> = await this.pool.query(
      "INSERT INTO items (name, effect, price) VALUES ($1, $2, $3) RETURNING *",
      [input.name, JSON.stringify(input.effect), input.price]
    );

    return this.mapRow(result.rows[0]);
  }

  async update(
    id: number,
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

  async delete(id: number): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM items WHERE id = $1", [
      id,
    ]);
    return (result.rowCount ?? 0) > 0;
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
