import { ProductImage } from '../../domain/entities/ProductImage';

export interface ProductListItemDTO {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  categoryId: string;
  basePrice: number;
  salePrice: number | null;
  stock: number;
  primaryImageUrl: string | null;
}

export interface ProductDetailDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  categoryId: string;
  basePrice: number;
  salePrice: number | null;
  stock: number;
  isActive: boolean;
  images: ProductImage[];
  related: ProductListItemDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductDTO {
  name: string;
  description?: string;
  brand?: string;
  categoryId: string;
  basePrice: number;
  salePrice?: number;
  stock: number;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  brand?: string;
  categoryId?: string;
  basePrice?: number;
  salePrice?: number | null;
  stock?: number;
  isActive?: boolean;
}

export interface ProductFilterDTO {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'name';
  page?: number;
  limit?: number;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
}

export interface CreateCategoryDTO {
  name: string;
  parentId?: string;
  description?: string;
}
