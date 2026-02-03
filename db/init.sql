CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  effect TEXT NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_price ON items(price);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);

-- Insert default potions
INSERT INTO items (id, name, effect, price, created_at) VALUES 
  (0, 'Skibidi Potion', '{"HP": 40}', 50, NOW()),
  (1, 'La Gourde du Brave', '{"Attack": 15}', 75, NOW())
ON CONFLICT (id) DO NOTHING;


