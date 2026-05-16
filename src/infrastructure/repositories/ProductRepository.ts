import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/knex';
import {
  IProductRepository,
  ProductFilter,
  CreateProductData,
  UpdateProductData,
  ProductWithImages,
} from '../../domain/repositories/IProductRepository';
import { Product } from '../../domain/entities/Product';
import { ProductImage } from '../../domain/entities/ProductImage';
import { ProductSearchService } from '../../domain/services/ProductSearchService';

export class ProductRepository implements IProductRepository {
  private toProduct(row: Record<string, unknown>): Product {
    return {
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      description: (row.description as string) ?? null,
      brand: (row.brand as string) ?? null,
      categoryId: row.category_id as string,
      basePrice: row.base_price as number,
      salePrice: (row.sale_price as number) ?? null,
      stock: row.stock as number,
      isActive: row.is_active as boolean,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
    };
  }

  private toImage(row: Record<string, unknown>): ProductImage {
    return {
      id: row.id as string,
      productId: row.product_id as string,
      url: row.url as string,
      isPrimary: row.is_primary as boolean,
      sortOrder: row.sort_order as number,
    };
  }

  async findMany(filter: ProductFilter): Promise<{ data: Product[]; total: number }> {
    const { limit, offset } = ProductSearchService.buildFilterQuery(filter);

    let query = db('products').whereNull('deleted_at').where('is_active', true);
    let countQuery = db('products').whereNull('deleted_at').where('is_active', true);

    if (filter.categoryId) {
      query = query.where('category_id', filter.categoryId);
      countQuery = countQuery.where('category_id', filter.categoryId);
    }
    if (filter.minPrice !== undefined) {
      query = query.where('base_price', '>=', filter.minPrice);
      countQuery = countQuery.where('base_price', '>=', filter.minPrice);
    }
    if (filter.maxPrice !== undefined) {
      query = query.where('base_price', '<=', filter.maxPrice);
      countQuery = countQuery.where('base_price', '<=', filter.maxPrice);
    }
    if (filter.inStock) {
      query = query.where('stock', '>', 0);
      countQuery = countQuery.where('stock', '>', 0);
    }
    if (filter.search) {
      const searchTerm = filter.search;
      query = query.whereRaw('name ILIKE ?', [`%${searchTerm}%`]);
      countQuery = countQuery.whereRaw('name ILIKE ?', [`%${searchTerm}%`]);
    }

    switch (filter.sort) {
      case 'price_asc':
        query = query.orderBy('base_price', 'asc');
        break;
      case 'price_desc':
        query = query.orderBy('base_price', 'desc');
        break;
      case 'name':
        query = query.orderBy('name', 'asc');
        break;
      default:
        query = query.orderBy('created_at', 'desc');
    }

    const [{ count }] = await countQuery.count('id as count');
    const rows = await query.limit(limit).offset(offset).select('*');

    return {
      data: rows.map((r: Record<string, unknown>) => this.toProduct(r)),
      total: Number(count),
    };
  }

  async findBySlug(slug: string): Promise<ProductWithImages | null> {
    const row = await db('products').where({ slug }).whereNull('deleted_at').first();
    if (!row) return null;
    const images = await db('product_images')
      .where({ product_id: row.id })
      .orderBy('sort_order', 'asc')
      .select('*');
    return {
      ...this.toProduct(row),
      images: images.map((i: Record<string, unknown>) => this.toImage(i)),
    };
  }

  async findById(id: string): Promise<Product | null> {
    const row = await db('products').where({ id }).whereNull('deleted_at').first();
    return row ? this.toProduct(row) : null;
  }

  async findRelated(categoryId: string, excludeId: string, limit = 4): Promise<Product[]> {
    const rows = await db('products')
      .where('category_id', categoryId)
      .whereNot('id', excludeId)
      .whereNull('deleted_at')
      .where('is_active', true)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .select('*');
    return rows.map((r: Record<string, unknown>) => this.toProduct(r));
  }

  async create(data: CreateProductData): Promise<Product> {
    const [row] = await db('products')
      .insert({
        id: data.id || uuidv4(),
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        brand: data.brand ?? null,
        category_id: data.categoryId,
        base_price: data.basePrice,
        sale_price: data.salePrice ?? null,
        stock: data.stock,
      })
      .returning('*');
    return this.toProduct(row);
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.brand !== undefined) updateData.brand = data.brand;
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
    if (data.basePrice !== undefined) updateData.base_price = data.basePrice;
    if ('salePrice' in data) updateData.sale_price = data.salePrice;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const [row] = await db('products').where({ id }).update(updateData).returning('*');
    return this.toProduct(row);
  }

  async softDelete(id: string): Promise<void> {
    await db('products').where({ id }).update({ deleted_at: new Date() });
  }

  async addImages(images: ProductImage[]): Promise<void> {
    if (!images.length) return;
    await db('product_images').insert(
      images.map((img) => ({
        id: img.id,
        product_id: img.productId,
        url: img.url,
        is_primary: img.isPrimary,
        sort_order: img.sortOrder,
      })),
    );
  }

  async deleteImages(productId: string): Promise<void> {
    await db('product_images').where({ product_id: productId }).delete();
  }

  async findPrimaryImage(productId: string): Promise<ProductImage | null> {
    const row = await db('product_images')
      .where({ product_id: productId, is_primary: true })
      .first();
    return row ? this.toImage(row) : null;
  }
}
