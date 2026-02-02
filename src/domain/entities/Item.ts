export interface Item {
  id: string;
  name: string;
  effect: Record<string, number>;
  price: number;
  createdAt: Date;
}
