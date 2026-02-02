import { ItemService } from "../application/services/ItemService";
import { ItemRepository } from "../domain/repositories/ItemRepository";
import { Item } from "../domain/entities/Item";

class InMemoryItemRepository implements ItemRepository {
  private items: Item[] = [];

  async getAll(): Promise<Item[]> {
    return this.items;
  }

  async getById(id: string): Promise<Item | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async create(input: Omit<Item, "id" | "createdAt">): Promise<Item> {
    const created: Item = {
      id: `id-${this.items.length + 1}`,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      ...input,
    };
    this.items.push(created);
    return created;
  }

  async update(
    id: string,
    input: Omit<Item, "id" | "createdAt">
  ): Promise<Item | null> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }

    const updated: Item = {
      ...this.items[index],
      ...input,
    };
    this.items[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const before = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    return this.items.length < before;
  }
}

describe("ItemService", () => {
  it("creates an item", async () => {
    const repo = new InMemoryItemRepository();
    const service = new ItemService(repo);

    const created = await service.create({
      name: "Potion",
      effect: { HP: 40 },
      price: 50,
    });

    expect(created.id).toBeDefined();
    expect(created.effect.HP).toBe(40);
  });

  it("updates an item", async () => {
    const repo = new InMemoryItemRepository();
    const service = new ItemService(repo);

    const created = await service.create({
      name: "Potion",
      effect: { HP: 40 },
      price: 50,
    });

    const updated = await service.update(created.id, {
      name: "Mega Potion",
      effect: { HP: 100 },
      price: 150,
    });

    expect(updated).not.toBeNull();
    expect(updated?.name).toBe("Mega Potion");
  });

  it("returns null when updating missing item", async () => {
    const repo = new InMemoryItemRepository();
    const service = new ItemService(repo);

    const updated = await service.update("missing", {
      name: "Mega Potion",
      effect: { HP: 100 },
      price: 150,
    });

    expect(updated).toBeNull();
  });
});
