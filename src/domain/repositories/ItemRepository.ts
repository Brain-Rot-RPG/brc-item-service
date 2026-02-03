import { Item } from "../entities/Item";

export interface ItemRepository {
  getAll(): Promise<Item[]>;
  getById(id: number): Promise<Item | null>;
  create(input: Omit<Item, "id" | "createdAt">): Promise<Item>;
  update(id: number, input: Omit<Item, "id" | "createdAt">): Promise<Item | null>;
  delete(id: number): Promise<boolean>;
}
