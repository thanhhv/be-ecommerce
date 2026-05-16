export class Email {
  private readonly value: string;

  constructor(email: string) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email address');
    }
    this.value = email.toLowerCase();
  }

  toString(): string {
    return this.value;
  }
}
