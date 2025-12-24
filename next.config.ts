import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/sign/**',
      },
    ],
    // Tối ưu để giảm số lần optimize (giảm chi phí Vercel)
    formats: ['image/webp'], // Chỉ dùng webp, bỏ avif để giảm transformations
    // Giảm số lượng sizes để giảm transformations
    deviceSizes: [640, 828, 1200, 1920], // Giảm từ 6 xuống 4
    imageSizes: [64, 128, 256, 384], // Giảm từ 8 xuống 4
    // Tăng cache time lên 1 năm để giảm cache writes
    minimumCacheTTL: 31536000, // 1 năm (thay vì 60 giây)
    // Tắt một số tính năng không cần thiết
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
