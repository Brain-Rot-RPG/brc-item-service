export interface Item {
  id: number;
  name: string;
  effect: Record<string, number>;
  price: number;
  createdAt: Date;
}
