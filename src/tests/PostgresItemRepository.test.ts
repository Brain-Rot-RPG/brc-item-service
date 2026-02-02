import { Pool } from "pg";
import { PostgresItemRepository } from "../infrastructure/database/PostgresItemRepository";

// Mock pg Pool
jest.mock("pg", () => {
  const mockQuery = jest.fn();
  return {
    Pool: jest.fn(() => ({
      query: mockQuery,
    })),
  };
});

describe("PostgresItemRepository", () => {
  let pool: Pool;
  let repository: PostgresItemRepository;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    pool = new Pool();
    mockQuery = pool.query as jest.Mock;
    mockQuery.mockReset();
    repository = new PostgresItemRepository(pool);
  });

  describe("getAll", () => {
    it("returns all items from database", async () => {
      const mockRows = [
        {
          id: "uuid-1",
          name: "Potion",
          effect: JSON.stringify({ HP: 40 }),
          price: 50,
          created_at: new Date("2026-01-01"),
        },
        {
          id: "uuid-2",
          name: "Ether",
          effect: JSON.stringify({ MP: 30 }),
          price: 75,
          created_at: new Date("2026-01-02"),
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockRows });

      const result = await repository.getAll();

      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT * FROM items ORDER BY created_at DESC"
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "uuid-1",
        name: "Potion",
        effect: { HP: 40 },
        price: 50,
        createdAt: new Date("2026-01-01"),
      });
    });

    it("parses complex effect objects", async () => {
      const mockRows = [
        {
          id: "uuid-1",
          name: "Elixir",
          effect: JSON.stringify({ HP: 100, MP: 50, Attack: 10 }),
          price: 200,
          created_at: new Date("2026-01-01"),
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockRows });

      const result = await repository.getAll();

      expect(result[0].effect).toEqual({ HP: 100, MP: 50, Attack: 10 });
    });
  });

  describe("getById", () => {
    it("returns item when found", async () => {
      const mockRow = {
        id: "uuid-1",
        name: "Potion",
        effect: JSON.stringify({ HP: 40 }),
        price: 50,
        created_at: new Date("2026-01-01"),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockRow], rowCount: 1 });

      const result = await repository.getById("uuid-1");

      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT * FROM items WHERE id = $1",
        ["uuid-1"]
      );
      expect(result).toEqual({
        id: "uuid-1",
        name: "Potion",
        effect: { HP: 40 },
        price: 50,
        createdAt: new Date("2026-01-01"),
      });
    });

    it("returns null when item not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await repository.getById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("creates an item with simple effect", async () => {
      const mockRow = {
        id: "generated-uuid",
        name: "Potion",
        effect: JSON.stringify({ HP: 40 }),
        price: 50,
        created_at: new Date("2026-01-01"),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockRow] });

      const result = await repository.create({
        name: "Potion",
        effect: { HP: 40 },
        price: 50,
      });

      expect(mockQuery).toHaveBeenCalledWith(
        "INSERT INTO items (id, name, effect, price) VALUES ($1, $2, $3, $4) RETURNING *",
        expect.arrayContaining([
          expect.any(String),
          "Potion",
          JSON.stringify({ HP: 40 }),
          50,
        ])
      );
      expect(result.name).toBe("Potion");
      expect(result.effect).toEqual({ HP: 40 });
    });

    it("creates an item with complex effect", async () => {
      const complexEffect = { HP: 100, MP: 50, Attack: 10, Defense: 5 };
      const mockRow = {
        id: "generated-uuid",
        name: "Elixir",
        effect: JSON.stringify(complexEffect),
        price: 200,
        created_at: new Date("2026-01-01"),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockRow] });

      const result = await repository.create({
        name: "Elixir",
        effect: complexEffect,
        price: 200,
      });

      expect(result.effect).toEqual(complexEffect);
    });
  });

  describe("update", () => {
    it("updates an item and returns it", async () => {
      const mockRow = {
        id: "uuid-1",
        name: "Mega Potion",
        effect: JSON.stringify({ HP: 100 }),
        price: 150,
        created_at: new Date("2026-01-01"),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockRow], rowCount: 1 });

      const result = await repository.update("uuid-1", {
        name: "Mega Potion",
        effect: { HP: 100 },
        price: 150,
      });

      expect(mockQuery).toHaveBeenCalledWith(
        "UPDATE items SET name = $2, effect = $3, price = $4 WHERE id = $1 RETURNING *",
        ["uuid-1", "Mega Potion", JSON.stringify({ HP: 100 }), 150]
      );
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Mega Potion");
      expect(result?.effect).toEqual({ HP: 100 });
    });

    it("returns null when item not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await repository.update("non-existent", {
        name: "Updated",
        effect: { HP: 100 },
        price: 150,
      });

      expect(result).toBeNull();
    });

    it("serializes effect object correctly", async () => {
      const newEffect = { MP: 50, Attack: 20 };
      const mockRow = {
        id: "uuid-1",
        name: "Item",
        effect: JSON.stringify(newEffect),
        price: 100,
        created_at: new Date("2026-01-01"),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockRow], rowCount: 1 });

      await repository.update("uuid-1", {
        name: "Item",
        effect: newEffect,
        price: 100,
      });

      const callArgs = mockQuery.mock.calls[0][1];
      expect(callArgs[2]).toBe(JSON.stringify(newEffect));
    });
  });

  describe("delete", () => {
    it("returns true when item is deleted", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await repository.delete("uuid-1");

      expect(mockQuery).toHaveBeenCalledWith(
        "DELETE FROM items WHERE id = $1",
        ["uuid-1"]
      );
      expect(result).toBe(true);
    });

    it("returns false when item not found", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      const result = await repository.delete("non-existent");

      expect(result).toBe(false);
    });

    it("handles null rowCount", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: null });

      const result = await repository.delete("uuid-1");

      expect(result).toBe(false);
    });
  });
});
