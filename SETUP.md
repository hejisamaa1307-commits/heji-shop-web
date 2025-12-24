# Hướng dẫn Setup Project

## Bước 1: Cài đặt Dependencies

```bash
cd web-acc-shop
npm install
```

## Bước 2: Cấu hình Supabase

1. Tạo project mới trên [Supabase](https://supabase.com)
2. Tạo file `.env.local` trong thư mục root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. Tạo các bảng trong Supabase:

### Bảng `accounts`:
```sql
CREATE TABLE accounts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  price TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  main_acc TEXT,
  owner UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Bảng `account_images`:
```sql
CREATE TABLE account_images (
  id BIGSERIAL PRIMARY KEY,
  acc_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

4. Tạo Storage Bucket:
   - Tên bucket: `account_images`
   - Public: Yes
   - File size limit: 10MB

5. Cấu hình RLS (Row Level Security):
   - Cho phép public đọc `accounts`
   - Chỉ owner có thể thêm/sửa/xóa

## Bước 3: Chạy Project

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

## Bước 4: Tạo Admin User

1. Đăng ký/đăng nhập qua trang login
2. Trong Supabase Dashboard → Authentication → Users
3. Tìm user và thêm metadata: `{ "isAdmin": true }`

Hoặc chạy SQL:
```sql
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object('isAdmin', true)
WHERE email = 'your-admin-email@example.com';
```

## Tính năng đã có

✅ Upload ảnh với auto compress/resize (max 1920px)
✅ Quản lý tài khoản (CRUD)
✅ Tìm kiếm và filter theo giá
✅ Sort theo nhiều tiêu chí
✅ Dark/Light mode
✅ Responsive design
✅ Progress loading indicator
✅ Bulk operations

## Customization

Để thay đổi branding:
- Logo: `public/images/logo1.png`
- Tên shop: Tìm "FAT SHOP ACC" trong code và thay thế
- Màu sắc: `tailwind.config.js` và CSS files

