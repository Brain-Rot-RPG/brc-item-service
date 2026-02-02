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
  let repo: InMemoryItemRepository;
  let service: ItemService;

  beforeEach(() => {
    repo = new InMemoryItemRepository();
    service = new ItemService(repo);
  });

  describe("create", () => {
    it("creates an item with HP effect", async () => {
      const created = await service.create({
        name: "Potion",
        effect: { HP: 40 },
        price: 50,
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe("Potion");
      expect(created.effect.HP).toBe(40);
      expect(created.price).toBe(50);
      expect(created.createdAt).toBeDefined();
    });

    it("creates an item with multiple effects", async () => {
      const created = await service.create({
        name: "Elixir",
        effect: { HP: 100, Attack: 10, Defense: 5 },
        price: 200,
      });

      expect(created.effect.HP).toBe(100);
      expect(created.effect.Attack).toBe(10);
      expect(created.effect.Defense).toBe(5);
    });

    it("creates multiple items with unique ids", async () => {
      const first = await service.create({
        name: "Potion",
        effect: { HP: 40 },
        price: 50,
      });

      const second = await service.create({
        name: "Ether",
        effect: { MP: 30 },
        price: 75,
      });

      expect(first.id).not.toBe(second.id);
    });

    it("creates item with negative effects (debuff)", async () => {
      const created = await service.create({
        name: "Poison",
        effect: { HP: -20, Attack: -5 },
        price: 10,
      });

      expect(created.effect.HP).toBe(-20);
      expect(created.effect.Attack).toBe(-5);
    });

    it("creates expensive item", async () => {
      const created = await service.create({
        name: "Legendary Sword",
        effect: { Attack: 500 },
        price: 99999,
      });

      expect(created.price).toBe(99999);
    });
  });

  describe("getAll", () => {
    it("returns empty array when no items exist", async () => {
      const all = await service.getAll();
      expect(all).toEqual([]);
    });

    it("returns all created items", async () => {
      await service.create({
        name: "Potion",
        effect: { HP: 40 },
        price: 50,
      });
      await service.create({
        name: "Ether",
        effect: { MP: 30 },
        price: 75,
      });
      await service.create({
        name: "Phoenix Down",
        effect: { Revive: 1 },
        price: 100,
      });

      const all = await service.getAll();
      expect(all).toHaveLength(3);
      expect(all.map((i) => i.name)).toEqual([
        "Potion",
        "Ether",
        "Phoenix Down",
      ]);
    });
  });

  describe("getById", () => {
    it("returns item when it exists", async () => {
      const created = await service.create({
        name: "Potion",
        effect: { HP: 40 },
        price: 50,
      });

      const found = await service.getById(created.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe("Potion");
      expect(found?.effect.HP).toBe(40);
    });

    it("returns null when item does not exist", async () => {
      const found = await service.getById("non-existent-id");
      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("updates an item successfully", async () => {
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
      expect(updated?.effect.HP).toBe(100);
      expect(updated?.price).toBe(150);
    });

    it("updates effect type completely", async () => {
      const created = await service.create({
        name: "Potion",
        effect: { HP: 40 },
        price: 50,
      });

      const updated = await service.update(created.id, {
        name: "Potion",
        effect: { MP: 30, Attack: 5 },
        price: 50,
      });

      expect(updated?.effect).toEqual({ MP: 30, Attack: 5 });
      expect(updated?.effect.HP).toBeUndefined();
    });

    it("returns null when updating missing item", async () => {
      const updated = await service.update("missing", {
        name: "Mega Potion",
        effect: { HP: 100 },
        price: 150,
      });

      expect(updated).toBeNull();
    });

    it("preserves id and createdAt when updating", async () => {
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

      expect(updated?.id).toBe(created.id);
      expect(updated?.createdAt).toEqual(created.createdAt);
    });

    it("updates price to zero", async () => {
      const created = await service.create({
        name: "Free Sample",
        effect: { HP: 10 },
        price: 50,
      });

      const updated = await service.update(created.id, {
        name: "Free Sample",
        effect: { HP: 10 },
        price: 0,
      });

      expect(updated?.price).toBe(0);
    });
  });

  describe("delete", () => {
    it("deletes an existing item", async () => {
      const created = await service.create({
        name: "Potion",
        effect: { HP: 40 },
        price: 50,
      });

      const deleted = await service.delete(created.id);
      expect(deleted).toBe(true);

      const found = await service.getById(created.id);
      expect(found).toBeNull();
    });

    it("returns false when deleting non-existent item", async () => {
      const deleted = await service.delete("non-existent-id");
      expect(deleted).toBe(false);
    });

    it("removes item from getAll results", async () => {
      const first = await service.create({
        name: "Potion",
        effect: { HP: 40 },
        price: 50,
      });
      const second = await service.create({
        name: "Ether",
        effect: { MP: 30 },
        price: 75,
      });

      await service.delete(first.id);

      const all = await service.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(second.id);
    });

    it("can delete all items", async () => {
      const first = await service.create({
        name: "Potion",
        effect: { HP: 40 },
        price: 50,
      });
      const second = await service.create({
        name: "Ether",
        effect: { MP: 30 },
        price: 75,
      });

      await service.delete(first.id);
      await service.delete(second.id);

      const all = await service.getAll();
      expect(all).toEqual([]);
    });
  });
});
