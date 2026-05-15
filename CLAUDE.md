# E-Commerce Backend Roadmap
**Stack:** Node.js + Express + PostgreSQL  
**Architecture:** Clean Architecture (Presentation → Application → Domain → Infrastructure)

---

## Architecture Overview

```
src/
├── presentation/        # HTTP layer: routes, controllers, middlewares, validators
├── application/         # Use cases, DTOs, application services
├── domain/              # Entities, value objects, repository interfaces, domain services
├── infrastructure/      # DB implementations, external services, ORM, config
└── shared/              # Shared utils, errors, constants, types
```

### Layer Rules
- **Presentation** depends on Application only
- **Application** depends on Domain only
- **Domain** depends on nothing (pure business logic)
- **Infrastructure** depends on Domain (implements interfaces)
- Dependency injection via container (e.g. `awilix` or manual)

---

## Phase 0 — Project Foundation & Dev Setup ✅ DONE

**Goal:** Establish the scaffolding that all future phases build on.

### Tasks
- [x] Initialize Node.js project with TypeScript (`tsconfig.json`, strict mode)
- [x] Configure ESLint + Prettier + Husky (pre-commit hooks)
- [x] Setup folder structure following Clean Architecture
- [x] Configure environment management (`dotenv`, `.env.example`)
- [x] Setup PostgreSQL connection with Knex.js as query builder
- [x] Write base migration runner (Knex migrations)
- [x] Create shared error classes: `AppError`, `NotFoundError`, `ValidationError`, `UnauthorizedError`
- [x] Create base response wrapper: `ApiResponse<T>` with `success`, `data`, `message`, `pagination`
- [x] Setup global error handler middleware in Express
- [x] Setup request logger (Winston, with request ID)
- [x] Configure `Jest` + `Supertest` for unit and integration tests
- [x] Write a health check endpoint: `GET /api/v1/health`
- [x] Setup Docker Compose for local PostgreSQL

### Deliverables
- Running Express server with clean folder structure
- DB connection with migration support
- Standardized error handling and response format

---

## Phase 1 — Authentication & User Management

**Goal:** Users can register/login via Google OAuth2, manage their profile.

### Domain
- Entity: `User` (id, email, name, phone, address, avatar, provider, providerId, role, createdAt, updatedAt)
- Value Objects: `Email`, `Phone`
- Repository Interface: `IUserRepository` (findById, findByEmail, findByProviderId, create, update)

### Infrastructure
- `UserRepository` implementing `IUserRepository` using PostgreSQL
- Migration: `users` table
- Google OAuth2 integration via `passport-google-oauth20`
- JWT utility: `generateAccessToken`, `generateRefreshToken`, `verifyToken`
- `RefreshTokenRepository` (store hashed refresh tokens in DB)

### Application
- Use Cases:
  - `GoogleOAuthUseCase` — handle OAuth callback, create or find user, issue tokens
  - `RefreshTokenUseCase` — validate refresh token, issue new access token
  - `LogoutUseCase` — revoke refresh token
  - `GetProfileUseCase` — get current user info
  - `UpdateProfileUseCase` — update name, phone, address
- DTOs: `AuthResponseDTO`, `UserProfileDTO`, `UpdateProfileDTO`

### Presentation
- Routes:
  - `GET  /api/v1/auth/google` — redirect to Google
  - `GET  /api/v1/auth/google/callback` — OAuth callback
  - `POST /api/v1/auth/refresh` — refresh access token
  - `POST /api/v1/auth/logout` — logout
  - `GET  /api/v1/users/me` — get profile (protected)
  - `PUT  /api/v1/users/me` — update profile (protected)
- Middlewares:
  - `authenticate` — verify JWT, attach `req.user`
  - `validate` — Zod/Joi schema validation

### Database Tables
```sql
users (id, email, name, phone, address, avatar_url, provider, provider_id, role, created_at, updated_at)
refresh_tokens (id, user_id, token_hash, expires_at, created_at)
```

---

## Phase 2 — Product Catalog

**Goal:** Admin can manage products; users can browse, search, and filter.

### Domain
- Entities: `Product`, `Category`, `ProductImage`
- Value Objects: `Price`, `Slug`
- Repository Interfaces: `IProductRepository`, `ICategoryRepository`
- Domain Service: `ProductSearchService` (filter/sort/paginate logic)

### Infrastructure
- `ProductRepository`, `CategoryRepository`
- Migrations: `categories`, `products`, `product_images`
- Image storage interface: `IStorageService` (local for now, S3-ready)
- Local file storage implementation using `multer`

### Application
- Use Cases:
  - `ListProductsUseCase` — paginated list with filters (category, price range, name search, sort)
  - `GetProductDetailUseCase` — single product with images + related products
  - `CreateProductUseCase` (admin) — create product with images
  - `UpdateProductUseCase` (admin) — update product info/images
  - `DeleteProductUseCase` (admin) — soft delete
  - `ListCategoriesUseCase`
  - `CreateCategoryUseCase` (admin)
- DTOs: `ProductListDTO`, `ProductDetailDTO`, `CreateProductDTO`, `UpdateProductDTO`, `ProductFilterDTO`

### Presentation
- Routes:
  - `GET  /api/v1/products` — list with filters & pagination
  - `GET  /api/v1/products/:slug` — product detail
  - `GET  /api/v1/categories` — list categories
  - `POST /api/v1/admin/products` — create (admin)
  - `PUT  /api/v1/admin/products/:id` — update (admin)
  - `DELETE /api/v1/admin/products/:id` — delete (admin)
  - `POST /api/v1/admin/categories` — create category (admin)
- Middlewares: `authorizeAdmin` — check `req.user.role === 'admin'`

### Database Tables
```sql
categories (id, name, slug, parent_id, description, created_at)
products (id, name, slug, description, brand, category_id, base_price, sale_price, stock, is_active, created_at, updated_at, deleted_at)
product_images (id, product_id, url, is_primary, sort_order)
```

### Query Features
- Full-text search on `name` using PostgreSQL `ILIKE` or `tsvector`
- Filter by `category_id`, `price range`, `in_stock`
- Sort by `price ASC/DESC`, `newest`, `name`
- Cursor-based or offset pagination

---

## Phase 3 — Shopping Cart

**Goal:** Authenticated users can manage a persistent shopping cart.

### Domain
- Entities: `Cart`, `CartItem`
- Repository Interface: `ICartRepository`
- Domain Service: `CartService` (add, remove, update quantity, calculate totals)

### Infrastructure
- `CartRepository` (PostgreSQL)
- Migration: `carts`, `cart_items`

### Application
- Use Cases:
  - `GetCartUseCase` — get current user's cart with items and totals
  - `AddToCartUseCase` — add product, handle stock check
  - `UpdateCartItemUseCase` — change quantity
  - `RemoveCartItemUseCase` — remove item
  - `ClearCartUseCase` — clear all items (called after order placed)
- DTOs: `CartDTO`, `CartItemDTO`, `AddToCartDTO`

### Presentation
- Routes (all protected):
  - `GET    /api/v1/cart` — get cart
  - `POST   /api/v1/cart/items` — add item
  - `PUT    /api/v1/cart/items/:itemId` — update quantity
  - `DELETE /api/v1/cart/items/:itemId` — remove item
  - `DELETE /api/v1/cart` — clear cart

### Database Tables
```sql
carts (id, user_id, created_at, updated_at)
cart_items (id, cart_id, product_id, quantity, price_snapshot, created_at)
```

> `price_snapshot` stores the price at time of adding — prevents price change issues.

---

## Phase 4 — Orders & Checkout

**Goal:** Users can place orders, choose payment method (COD first), track order status.

### Domain
- Entities: `Order`, `OrderItem`, `ShippingAddress`
- Value Objects: `OrderStatus` (PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED)
- Repository Interface: `IOrderRepository`
- Domain Service: `OrderService` (calculate total, validate items, apply discount)

### Infrastructure
- `OrderRepository`
- Migrations: `orders`, `order_items`

### Application
- Use Cases:
  - `PlaceOrderUseCase` — create order from cart, deduct stock, clear cart
  - `GetOrderUseCase` — get order details by id (user can only see own)
  - `ListUserOrdersUseCase` — paginated list of user's orders
  - `CancelOrderUseCase` — cancel if status is PENDING
  - `UpdateOrderStatusUseCase` (admin) — update status
  - `ListAllOrdersUseCase` (admin) — all orders with filters
- DTOs: `PlaceOrderDTO`, `OrderDTO`, `OrderItemDTO`, `OrderListDTO`

### Presentation
- Routes:
  - `POST /api/v1/orders` — place order (protected)
  - `GET  /api/v1/orders` — list my orders (protected)
  - `GET  /api/v1/orders/:id` — order detail (protected)
  - `PUT  /api/v1/orders/:id/cancel` — cancel order (protected)
  - `GET  /api/v1/admin/orders` — all orders (admin)
  - `PUT  /api/v1/admin/orders/:id/status` — update status (admin)

### Database Tables
```sql
orders (id, user_id, status, payment_method, subtotal, shipping_fee, total, shipping_name, shipping_phone, shipping_address, notes, created_at, updated_at)
order_items (id, order_id, product_id, product_name_snapshot, product_image_snapshot, quantity, unit_price, total_price)
```

> Snapshots ensure order history is accurate even if product is later modified.

### Payment Methods (Phase 4a)
- `COD` (Cash on Delivery) — no integration needed, just store method
- `BANK_TRANSFER` — manual, admin confirms after verifying receipt

---

## Phase 5 — Admin Dashboard APIs

**Goal:** Full management APIs for admin panel.

### Use Cases (extending previous phases)
- **Product Management:** CRUD products, bulk update stock, upload/reorder images
- **Order Management:** Filter by status/date/user, export CSV, update status in bulk
- **Inventory Management:**
  - `GetInventoryUseCase` — list products with current stock levels
  - `AdjustStockUseCase` — manual stock adjustment with reason log
- **User Management:**
  - `ListUsersUseCase` — paginated user list
  - `BanUserUseCase` — disable account
- **Dashboard Stats:**
  - `GetDashboardStatsUseCase` — total revenue, orders today, low stock alerts, recent orders

### New Routes
- `GET  /api/v1/admin/dashboard/stats`
- `GET  /api/v1/admin/inventory`
- `PUT  /api/v1/admin/inventory/:productId/adjust`
- `GET  /api/v1/admin/users`
- `PUT  /api/v1/admin/users/:id/ban`
- `GET  /api/v1/admin/orders/export` (CSV)

### Database Tables
```sql
stock_adjustments (id, product_id, admin_id, quantity_change, reason, created_at)
```

---

## Phase 6 — Online Payment Integration (VNPay / MoMo)

**Goal:** Users can pay online; system handles webhook callbacks securely.

### Domain
- Entity: `Payment`
- Value Objects: `PaymentStatus` (PENDING, SUCCESS, FAILED, REFUNDED)
- Repository Interface: `IPaymentRepository`
- Domain Service: `PaymentService` (verify signature, handle callback)

### Infrastructure
- `VNPayGateway` implementing `IPaymentGateway`
- `MoMoGateway` implementing `IPaymentGateway`
- HMAC signature verification utility
- `PaymentRepository`

### Application
- Use Cases:
  - `InitiatePaymentUseCase` — create payment URL, store pending payment record
  - `HandlePaymentCallbackUseCase` — verify signature, update order + payment status
  - `RefundPaymentUseCase` (admin)

### Routes
- `POST /api/v1/payments/vnpay/initiate`
- `GET  /api/v1/payments/vnpay/callback` (VNPay redirect)
- `POST /api/v1/payments/vnpay/ipn` (VNPay server-to-server, no auth)
- `POST /api/v1/payments/momo/initiate`
- `POST /api/v1/payments/momo/callback`

### Database Tables
```sql
payments (id, order_id, provider, provider_transaction_id, amount, status, raw_response, created_at, updated_at)
```

---

## Cross-Cutting Concerns (All Phases)

### Security
- Helmet.js for HTTP headers
- Rate limiting: `express-rate-limit` (global + per auth route)
- Input sanitization: `xss` library or Zod transforms
- SQL injection prevention: parameterized queries only (never raw string concat)
- JWT: short-lived access token (15min), long-lived refresh token (7d) stored in httpOnly cookie

### Logging & Monitoring
- Structured logging with `Winston` (JSON format, log levels)
- Request ID middleware (`uuid` per request, log all layers with same ID)
- Log all DB query errors and unhandled rejections

### Testing Strategy
- **Unit tests:** Domain entities, use cases (mock repositories)
- **Integration tests:** Repository layer (test against real DB in Docker)
- **E2E tests:** Full HTTP flows via Supertest
- Coverage target: 80%+ on domain + application layers

### API Standards

All routes **must** use the `/api/v1/` prefix.

```
GET    /api/v1/resources           → list (paginated)
GET    /api/v1/resources/:id       → single
POST   /api/v1/resources           → create
PUT    /api/v1/resources/:id       → full update
PATCH  /api/v1/resources/:id       → partial update
DELETE /api/v1/resources/:id       → delete

Response envelope:
{
  "success": true,
  "data": <T> | null,
  "message": "string",
  "pagination": { "page", "limit", "total", "totalPages" } | null
}

Error envelope:
{
  "success": false,
  "error": { "code": "PRODUCT_NOT_FOUND", "message": "...", "details": [] }
}
```

### Swagger / OpenAPI Documentation

**Rule:** After completing each phase, add Swagger documentation for all new endpoints.

- Library: `swagger-ui-express` + `swagger-jsdoc`
- Docs available at: `GET /api/v1/docs`
- Annotate every route handler with JSDoc `@swagger` blocks
- Document request bodies, query params, path params, and all response schemas
- Group tags by domain (e.g. `Auth`, `Products`, `Cart`, `Orders`)
- The Swagger spec must stay in sync with the actual implementation — never leave it outdated

### Phase Status Convention

**Rule:** After implementing a phase, immediately update its heading in this file to `✅ DONE` and check off all completed tasks (`- [x]`). Phases not yet started remain as-is.

---

## Implementation Order Summary

| Phase | Focus | Est. Complexity |
|-------|-------|----------------|
| 0 | Project setup, base architecture | Low |
| 1 | Auth (Google OAuth2) + User profile | Medium |
| 2 | Product catalog + Categories + Image upload | Medium |
| 3 | Shopping cart | Low |
| 4 | Orders + Checkout (COD + Bank Transfer) | High |
| 5 | Admin dashboard APIs + Inventory | Medium |
| 6 | VNPay / MoMo integration | High |

---

## Recommended Dependencies

```json
{
  "express": "^4.x",
  "typescript": "^5.x",
  "pg": "^8.x",
  "knex": "^3.x",
  "passport": "^0.7.x",
  "passport-google-oauth20": "^2.x",
  "jsonwebtoken": "^9.x",
  "zod": "^3.x",
  "multer": "^1.x",
  "helmet": "^7.x",
  "express-rate-limit": "^7.x",
  "winston": "^3.x",
  "awilix": "^10.x",
  "jest": "^29.x",
  "supertest": "^6.x",
  "dotenv": "^16.x"
}
```

---

*This document serves as a living reference for AI-assisted implementation. Each phase is independently implementable. Always start from the Domain layer, then Application, then Infrastructure, then Presentation.*