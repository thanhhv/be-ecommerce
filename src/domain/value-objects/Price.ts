export class Price {
  private readonly value: number;
  constructor(amount: number) {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error('Price must be a non-negative integer (VND)');
    }
    this.value = amount;
  }
  toNumber(): number {
    return this.value;
  }
}
