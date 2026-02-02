import { Item } from "../../domain/entities/Item";
import { ItemRepository } from "../../domain/repositories/ItemRepository";

export interface ItemInput {
  name: string;
  effect: Record<string, number>;
  price: number;
}

export class ItemService {
  constructor(private readonly repository: ItemRepository) {}

  async getAll(): Promise<Item[]> {
    return this.repository.getAll();
  }

  async getById(id: string): Promise<Item | null> {
    return this.repository.getById(id);
  }

  async create(input: ItemInput): Promise<Item> {
    return this.repository.create(input);
  }

  async update(id: string, input: ItemInput): Promise<Item | null> {
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
