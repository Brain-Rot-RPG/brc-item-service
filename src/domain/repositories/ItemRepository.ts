import { Item } from "../entities/Item";

export interface ItemRepository {
  getAll(): Promise<Item[]>;
  getById(id: string): Promise<Item | null>;
  create(input: Omit<Item, "id" | "createdAt">): Promise<Item>;
  update(id: string, input: Omit<Item, "id" | "createdAt">): Promise<Item | null>;
  delete(id: string): Promise<boolean>;
}
