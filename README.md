# Heji Shop Acc

Một ứng dụng web bán tài khoản game được xây dựng với Next.js, React, TypeScript và Supabase.

## Tính năng

- ✅ Quản lý tài khoản (thêm, sửa, xóa)
- ✅ Upload và tối ưu hóa ảnh tự động
- ✅ Tìm kiếm và lọc theo giá
- ✅ Sắp xếp theo nhiều tiêu chí
- ✅ Dark/Light mode
- ✅ Responsive design
- ✅ Admin panel
- ✅ Tính năng góp (installment calculator)

## Cài đặt

1. Clone project:
```bash
cd heji-shop-acc
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env.local` với các biến môi trường:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Chạy development server:
```bash
npm run dev
```

5. Mở [http://localhost:3000](http://localhost:3000) trong browser

## Cấu trúc Project

```
web-acc-shop/
├── app/                    # Next.js App Router
│   ├── account/           # Trang chi tiết tài khoản
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   ├── home/              # Trang chủ
│   └── login/             # Trang đăng nhập
├── components/            # React components
│   ├── alerts/            # Modal/Alert components
│   ├── features/          # Feature components
│   └── layout/            # Layout components
├── public/                # Static files
└── lib/                   # Utilities
```

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Image Processing**: Sharp
- **UI Components**: HeroUI, Radix UI

## Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run start` - Chạy production server
- `npm run lint` - Chạy ESLint

## Tối ưu hóa

- ✅ Image compression và resize khi upload (max 1920px, quality 85)
- ✅ Next.js Image Optimization (tùy chọn)
- ✅ Lazy loading
- ✅ Code splitting
- ✅ SEO friendly

## License

Private project
