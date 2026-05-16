import { ProductFilter } from '../repositories/IProductRepository';

export class ProductSearchService {
  static buildFilterQuery(filter: ProductFilter): {
    page: number;
    limit: number;
    offset: number;
  } {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(50, Math.max(1, filter.limit ?? 20));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
  }
}
