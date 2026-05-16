export class Slug {
  private readonly value: string;
  constructor(text: string) {
    this.value = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    if (!this.value) throw new Error('Slug cannot be empty');
  }
  toString(): string {
    return this.value;
  }
  static from(text: string): Slug {
    return new Slug(text);
  }
}
