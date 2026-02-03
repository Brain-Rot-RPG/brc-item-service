import { Item } from "../../domain/entities/Item";
import { ItemRepository } from "../../domain/repositories/ItemRepository";

export type ItemInput = Omit<Item, "id" | "createdAt">;

export class ItemService {
  constructor(private readonly repository: ItemRepository) {}

  async getAll(): Promise<Item[]> {
    return this.repository.getAll();
  }

  async getById(id: number): Promise<Item | null> {
    return this.repository.getById(id);
  }

  async create(input: ItemInput): Promise<Item> {
    return this.repository.create(input);
  }

  async update(id: number, input: ItemInput): Promise<Item | null> {
    return this.repository.update(id, input);
  }

  async delete(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }
}
