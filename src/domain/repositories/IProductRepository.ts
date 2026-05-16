import { Product } from '../entities/Product';
import { ProductImage } from '../entities/ProductImage';

export interface ProductFilter {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'name';
  page?: number;
  limit?: number;
}

export interface CreateProductData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  categoryId: string;
  basePrice: number;
  salePrice?: number;
  stock: number;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  brand?: string;
  categoryId?: string;
  basePrice?: number;
  salePrice?: number | null;
  stock?: number;
  isActive?: boolean;
}

export interface ProductWithImages extends Product {
  images: ProductImage[];
}

export interface IProductRepository {
  findMany(filter: ProductFilter): Promise<{ data: Product[]; total: number }>;
  findBySlug(slug: string): Promise<ProductWithImages | null>;
  findById(id: string): Promise<Product | null>;
  findRelated(categoryId: string, excludeId: string, limit?: number): Promise<Product[]>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  softDelete(id: string): Promise<void>;
  addImages(images: Omit<ProductImage, never>[]): Promise<void>;
  deleteImages(productId: string): Promise<void>;
  findPrimaryImage(productId: string): Promise<ProductImage | null>;
}
