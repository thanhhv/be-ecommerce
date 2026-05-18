/* eslint-disable no-console */
import { v4 as uuidv4 } from 'uuid';
import knex from 'knex';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASS ?? 'postgres',
    database: process.env.DB_NAME ?? 'ecommerce',
  },
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const productTemplates = [
  // Cây cảnh trong nhà (Indoor Plants)
  { name: 'Cây Monstera Deliciosa', brand: 'GreenHome', basePrice: 350_000, salePrice: 280_000, stock: 25 },
  { name: 'Cây Kim Tiền', brand: 'GreenHome', basePrice: 120_000, salePrice: null, stock: 50 },
  { name: 'Cây Trầu Bà', brand: 'NatureVibe', basePrice: 85_000, salePrice: null, stock: 80 },
  { name: 'Cây Lưỡi Hổ (Sansevieria)', brand: 'NatureVibe', basePrice: 150_000, salePrice: 120_000, stock: 40 },
  { name: 'Cây Xương Rồng Mini', brand: 'DesertLife', basePrice: 45_000, salePrice: null, stock: 100 },
  { name: 'Cây Bạch Mã Hoàng Tử', brand: 'GreenHome', basePrice: 220_000, salePrice: null, stock: 30 },
  { name: 'Cây Đuôi Công', brand: 'NatureVibe', basePrice: 180_000, salePrice: 150_000, stock: 20 },
  { name: 'Cây Sung Bonsai', brand: 'BonsaiArt', basePrice: 850_000, salePrice: 750_000, stock: 10 },
  { name: 'Cây Thanh Long Mini', brand: 'DesertLife', basePrice: 65_000, salePrice: null, stock: 60 },
  { name: 'Cây Hoa Lan Hồ Điệp Trắng', brand: 'FloraViet', basePrice: 280_000, salePrice: 230_000, stock: 15 },

  // Cây hoa (Flowering Plants)
  { name: 'Hoa Hồng Đỏ', brand: 'FloraViet', basePrice: 95_000, salePrice: null, stock: 70 },
  { name: 'Hoa Cúc Vàng', brand: 'FloraViet', basePrice: 55_000, salePrice: null, stock: 90 },
  { name: 'Hoa Violet', brand: 'GardenLux', basePrice: 75_000, salePrice: 60_000, stock: 45 },
  { name: 'Hoa Sen Đá (Echeveria)', brand: 'DesertLife', basePrice: 42_000, salePrice: null, stock: 120 },
  { name: 'Hoa Đồng Tiền', brand: 'FloraViet', basePrice: 38_000, salePrice: null, stock: 100 },
  { name: 'Hoa Hướng Dương Mini', brand: 'GardenLux', basePrice: 68_000, salePrice: 55_000, stock: 50 },
  { name: 'Hoa Lavender Pháp', brand: 'GardenLux', basePrice: 195_000, salePrice: 160_000, stock: 25 },
  { name: 'Hoa Bạch Cúc', brand: 'FloraViet', basePrice: 45_000, salePrice: null, stock: 80 },
  { name: 'Hoa Trà Mi', brand: 'FloraViet', basePrice: 320_000, salePrice: null, stock: 18 },
  { name: 'Hoa Địa Lan Hồng', brand: 'FloraViet', basePrice: 450_000, salePrice: 380_000, stock: 12 },

  // Cây ăn quả (Fruit Plants)
  { name: 'Cây Chanh Leo', brand: 'FruitGarden', basePrice: 75_000, salePrice: null, stock: 55 },
  { name: 'Cây Dâu Tây', brand: 'FruitGarden', basePrice: 88_000, salePrice: 72_000, stock: 40 },
  { name: 'Cây Ớt Cherry', brand: 'VeggiePro', basePrice: 35_000, salePrice: null, stock: 90 },
  { name: 'Cây Cà Chua Bi', brand: 'VeggiePro', basePrice: 42_000, salePrice: null, stock: 75 },
  { name: 'Cây Dừa Mini', brand: 'FruitGarden', basePrice: 250_000, salePrice: null, stock: 20 },
  { name: 'Cây Sung (Ficus Carica)', brand: 'FruitGarden', basePrice: 320_000, salePrice: 280_000, stock: 15 },
  { name: 'Cây Thanh Trà Bonsai', brand: 'BonsaiArt', basePrice: 1_200_000, salePrice: null, stock: 5 },
  { name: 'Cây Ổi Không Hạt', brand: 'FruitGarden', basePrice: 185_000, salePrice: null, stock: 28 },
  { name: 'Cây Chanh Tứ Quý', brand: 'FruitGarden', basePrice: 145_000, salePrice: 120_000, stock: 35 },
  { name: 'Cây Nhãn Lồng', brand: 'FruitGarden', basePrice: 280_000, salePrice: null, stock: 10 },

  // Cây rau sạch (Vegetables/Herbs)
  { name: 'Rau Húng Quế', brand: 'VeggiePro', basePrice: 25_000, salePrice: null, stock: 150 },
  { name: 'Rau Mùi Ta', brand: 'VeggiePro', basePrice: 22_000, salePrice: null, stock: 130 },
  { name: 'Cây Bạc Hà', brand: 'VeggiePro', basePrice: 28_000, salePrice: null, stock: 120 },
  { name: 'Cây Xả Hương', brand: 'VeggiePro', basePrice: 32_000, salePrice: null, stock: 100 },
  { name: 'Rau Diếp Cá', brand: 'VeggiePro', basePrice: 18_000, salePrice: null, stock: 200 },
  { name: 'Cây Nha Đam (Lô Hội)', brand: 'NatureVibe', basePrice: 55_000, salePrice: null, stock: 80 },
  { name: 'Cây Nghệ Vàng', brand: 'NatureVibe', basePrice: 48_000, salePrice: 38_000, stock: 60 },
  { name: 'Cây Gừng Mini', brand: 'VeggiePro', basePrice: 35_000, salePrice: null, stock: 90 },
  { name: 'Cây Rau Diếp Xanh', brand: 'VeggiePro', basePrice: 20_000, salePrice: null, stock: 180 },
  { name: 'Cây Tía Tô', brand: 'VeggiePro', basePrice: 22_000, salePrice: null, stock: 160 },

  // Dụng cụ làm vườn (Gardening Tools)
  { name: 'Bộ Dụng Cụ Làm Vườn 5 Món', brand: 'GardenTools', basePrice: 285_000, salePrice: 245_000, stock: 30 },
  { name: 'Bình Xịt Nước 1.5L', brand: 'GardenTools', basePrice: 65_000, salePrice: null, stock: 80 },
  { name: 'Xẻng Trồng Cây Mini', brand: 'GardenTools', basePrice: 38_000, salePrice: null, stock: 120 },
  { name: 'Kéo Cắt Cành Chuyên Nghiệp', brand: 'GardenTools', basePrice: 185_000, salePrice: 155_000, stock: 40 },
  { name: 'Chậu Nhựa Tròn 30cm', brand: 'PotWorld', basePrice: 45_000, salePrice: null, stock: 200 },
  { name: 'Chậu Sứ Hoa Văn', brand: 'PotWorld', basePrice: 125_000, salePrice: 100_000, stock: 60 },
  { name: 'Chậu Gỗ Hình Vuông', brand: 'PotWorld', basePrice: 215_000, salePrice: null, stock: 35 },
  { name: 'Khay Hứng Nước Đa Năng', brand: 'GardenTools', basePrice: 35_000, salePrice: null, stock: 150 },
  { name: 'Bộ Tưới Nhỏ Giọt 20 Cây', brand: 'GardenTools', basePrice: 320_000, salePrice: 280_000, stock: 20 },
  { name: 'Bình Tưới Ôtô 2L', brand: 'GardenTools', basePrice: 88_000, salePrice: null, stock: 70 },

  // Đất và phân bón (Soil & Fertilizer)
  { name: 'Đất Trồng Cây Đa Năng 5L', brand: 'SoilPro', basePrice: 45_000, salePrice: null, stock: 200 },
  { name: 'Phân Bón Hữu Cơ 1kg', brand: 'NutriFarm', basePrice: 68_000, salePrice: 55_000, stock: 150 },
  { name: 'Đất Trộn Xương Rồng 3L', brand: 'SoilPro', basePrice: 38_000, salePrice: null, stock: 100 },
  { name: 'Phân NPK Tổng Hợp 500g', brand: 'NutriFarm', basePrice: 55_000, salePrice: null, stock: 120 },
  { name: 'Phân Bón Lá Đa Vi Lượng', brand: 'NutriFarm', basePrice: 78_000, salePrice: 65_000, stock: 90 },
  { name: 'Đất Trồng Rau Sạch 10L', brand: 'SoilPro', basePrice: 85_000, salePrice: null, stock: 80 },
  { name: 'Vỏ Trấu Hữu Cơ 5L', brand: 'SoilPro', basePrice: 32_000, salePrice: null, stock: 150 },
  { name: 'Viên Phân Bón Chậm Tan', brand: 'NutriFarm', basePrice: 95_000, salePrice: 80_000, stock: 70 },
  { name: 'Dung Dịch Dinh Dưỡng Thủy Canh A+B', brand: 'HydroFarm', basePrice: 145_000, salePrice: null, stock: 40 },
  { name: 'Tro Trấu Cải Tạo Đất', brand: 'SoilPro', basePrice: 28_000, salePrice: null, stock: 200 },

  // Cây bonsai (Bonsai)
  { name: 'Cây Sanh Bonsai 5 Năm', brand: 'BonsaiArt', basePrice: 1_800_000, salePrice: 1_500_000, stock: 3 },
  { name: 'Cây Lộc Vừng Bonsai', brand: 'BonsaiArt', basePrice: 2_200_000, salePrice: null, stock: 2 },
  { name: 'Cây Si Bonsai Mini', brand: 'BonsaiArt', basePrice: 450_000, salePrice: 380_000, stock: 8 },
  { name: 'Cây Duối Bonsai', brand: 'BonsaiArt', basePrice: 680_000, salePrice: null, stock: 6 },
  { name: 'Cây Bàng Đài Loan Bonsai', brand: 'BonsaiArt', basePrice: 380_000, salePrice: 320_000, stock: 10 },
  { name: 'Cây Nguyệt Quế Bonsai', brand: 'BonsaiArt', basePrice: 520_000, salePrice: null, stock: 7 },
  { name: 'Cây Linh Sam Bonsai', brand: 'BonsaiArt', basePrice: 950_000, salePrice: 850_000, stock: 4 },
  { name: 'Cây Tùng La Hán Bonsai', brand: 'BonsaiArt', basePrice: 1_500_000, salePrice: null, stock: 3 },
  { name: 'Chậu Bonsai Cao Cấp Nhật Bản', brand: 'BonsaiArt', basePrice: 380_000, salePrice: 320_000, stock: 15 },
  { name: 'Kéo Tỉa Bonsai Chuyên Dụng', brand: 'BonsaiArt', basePrice: 285_000, salePrice: null, stock: 20 },

  // Cây ngoài trời (Outdoor Plants)
  { name: 'Cây Dứa Phong Thủy', brand: 'OutdoorGreen', basePrice: 165_000, salePrice: null, stock: 35 },
  { name: 'Cây Tre Trúc Nhật', brand: 'OutdoorGreen', basePrice: 125_000, salePrice: 100_000, stock: 40 },
  { name: 'Cây Hoa Giấy Đỏ', brand: 'OutdoorGreen', basePrice: 95_000, salePrice: null, stock: 55 },
  { name: 'Cây Hoa Sứ (Plumeria)', brand: 'FloraViet', basePrice: 280_000, salePrice: 240_000, stock: 20 },
  { name: 'Cây Vạn Tuế Mini', brand: 'OutdoorGreen', basePrice: 380_000, salePrice: null, stock: 12 },
  { name: 'Cây Dừa Cảnh', brand: 'OutdoorGreen', basePrice: 450_000, salePrice: 390_000, stock: 8 },
  { name: 'Cây Thiên Lý', brand: 'OutdoorGreen', basePrice: 78_000, salePrice: null, stock: 60 },
  { name: 'Cây Hoa Chiều Tím', brand: 'FloraViet', basePrice: 55_000, salePrice: 45_000, stock: 75 },
  { name: 'Cây Thường Xuân Leo', brand: 'OutdoorGreen', basePrice: 88_000, salePrice: null, stock: 50 },
  { name: 'Cây Bụi Hồng Leo', brand: 'FloraViet', basePrice: 245_000, salePrice: 200_000, stock: 18 },

  // Phụ kiện (Accessories)
  { name: 'Đèn LED Trồng Cây 45W', brand: 'PlantLight', basePrice: 485_000, salePrice: 420_000, stock: 20 },
  { name: 'Cọc Hỗ Trợ Cây 80cm', brand: 'GardenTools', basePrice: 28_000, salePrice: null, stock: 200 },
  { name: 'Lưới Trồng Cây Thủy Canh', brand: 'HydroFarm', basePrice: 145_000, salePrice: null, stock: 30 },
  { name: 'Máy Đo Độ Ẩm Đất', brand: 'SmartGarden', basePrice: 185_000, salePrice: 155_000, stock: 25 },
  { name: 'Hạt Giống Hoa Hỗn Hợp', brand: 'SeedViet', basePrice: 35_000, salePrice: null, stock: 150 },
  { name: 'Hạt Giống Rau Sạch Combo 10 Gói', brand: 'SeedViet', basePrice: 95_000, salePrice: 80_000, stock: 80 },
  { name: 'Giá Đỡ Cây Treo Tường', brand: 'PotWorld', basePrice: 125_000, salePrice: null, stock: 45 },
  { name: 'Bao Tay Làm Vườn Chống Gai', brand: 'GardenTools', basePrice: 65_000, salePrice: 52_000, stock: 100 },
  { name: 'Dây Buộc Cây Mềm 50m', brand: 'GardenTools', basePrice: 42_000, salePrice: null, stock: 120 },
  { name: 'Chậu Treo Cỡ Lớn', brand: 'PotWorld', basePrice: 88_000, salePrice: null, stock: 60 },
];

async function seed() {
  console.log('Fetching categories...');
  const categories = await db('categories').select('id', 'name', 'slug');

  if (categories.length === 0) {
    console.error('No categories found. Please seed categories first or create them via admin.');
    await db.destroy();
    process.exit(1);
  }

  console.log(`Found ${categories.length} categories:`, categories.map((c: { name: string }) => c.name).join(', '));

  // Distribute products across available categories
  const categoryIds = categories.map((c: { id: string }) => c.id);

  const existingSlugs = new Set<string>(
    (await db('products').select('slug')).map((r: { slug: string }) => r.slug)
  );

  const productsToInsert: Record<string, unknown>[] = [];
  const imagesToInsert: Record<string, unknown>[] = [];

  productTemplates.forEach((tpl, idx) => {
    let slug = slugify(tpl.name);
    if (existingSlugs.has(slug)) {
      const suffix = Math.random().toString(36).slice(2, 6);
      slug = `${slug}-${suffix}`;
    }
    existingSlugs.add(slug);

    const categoryId = categoryIds[idx % categoryIds.length];
    const productId = uuidv4();

    productsToInsert.push({
      id: productId,
      name: tpl.name,
      slug,
      brand: tpl.brand,
      category_id: categoryId,
      base_price: tpl.basePrice,
      sale_price: tpl.salePrice ?? null,
      stock: tpl.stock,
      is_active: true,
      description: `${tpl.name} - sản phẩm chất lượng cao, phù hợp cho không gian sống xanh của bạn.`,
      created_at: new Date(),
      updated_at: new Date(),
    });

    imagesToInsert.push({
      id: uuidv4(),
      product_id: productId,
      url: `https://placehold.co/600x600/3a6b35/ffffff?text=${encodeURIComponent(tpl.name.split(' ').slice(0, 2).join('+'))}`,
      is_primary: true,
      sort_order: 0,
    });
  });

  console.log(`Inserting ${productsToInsert.length} products...`);
  await db.batchInsert('products', productsToInsert, 20);

  console.log(`Inserting ${imagesToInsert.length} product images...`);
  await db.batchInsert('product_images', imagesToInsert, 20);

  console.log('✅ Seed complete!');
  await db.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  void db.destroy();
  process.exit(1);
});
