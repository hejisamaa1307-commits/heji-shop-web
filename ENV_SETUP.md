# Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục root với nội dung sau:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Lấy thông tin từ Supabase:

1. Vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (⚠️ Bảo mật key này!)

## Lưu ý:

- File `.env.local` đã được thêm vào `.gitignore` nên sẽ không bị commit
- Không chia sẻ `SERVICE_ROLE_KEY` với bất kỳ ai
- Chỉ dùng `SERVICE_ROLE_KEY` ở server-side (API routes)

