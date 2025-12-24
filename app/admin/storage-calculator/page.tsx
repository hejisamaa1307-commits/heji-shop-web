"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import Navbar from '@/components/layout/navbar';

export default function StorageCalculator() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStorageStats();
  }, []);

  async function fetchStorageStats() {
    try {
      setLoading(true);

      // Get account count
      const { count: accountCount } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true });

      // Get account_images count
      const { count: imageCount } = await supabase
        .from('account_images')
        .select('*', { count: 'exact', head: true });

      // Get storage size from bucket using storage API
      let totalStorageBytes = 0;
      let fileCount = 0;
      try {
        const { data: files, error: storageError } = await supabase.storage
          .from('account_images')
          .list('', {
            limit: 10000,
            sortBy: { column: 'created_at', order: 'asc' }
          });

        if (files && !storageError) {
          fileCount = files.length;
          files.forEach((file: any) => {
            // Metadata size is in bytes
            const size = file.metadata?.size || file.metadata?.fileSize || 0;
            totalStorageBytes += parseInt(size) || 0;
          });
        }

        // If there are more files, we need to paginate (but for now, estimate)
        if (files && files.length === 10000) {
          console.warn('Có thể có nhiều hơn 10000 files, chỉ tính 10000 files đầu tiên');
        }

        if (storageError) {
          console.error('Storage error:', storageError);
        }
      } catch (storageErr) {
        console.error('Error fetching storage:', storageErr);
      }

      // Get database size - estimate based on row count
      // Since we can't directly query database size, we'll estimate
      const estimatedDbSizeKB = ((accountCount || 0) * 7) + ((imageCount || 0) * 2); // Rough estimate

      const totalStorageMB = totalStorageBytes / (1024 * 1024);
      const totalStorageGB = totalStorageMB / 1024;

      // Calculate averages
      const accountCountNum = accountCount || 0;
      const avgDbPerAccount = accountCountNum > 0 ? (estimatedDbSizeKB / accountCountNum) : 0;
      const avgStoragePerAccount = accountCountNum > 0 ? (totalStorageMB / accountCountNum) : 0;

      // Calculate capacity
      const dbLimitMB = 500; // 500 MB free tier
      const storageLimitGB = 1; // 1 GB free tier
      const storageLimitMB = storageLimitGB * 1024;

      const maxAccountsByDb = avgDbPerAccount > 0 ? Math.floor((dbLimitMB * 1024) / avgDbPerAccount) : 0;
      const maxAccountsByStorage = avgStoragePerAccount > 0 ? Math.floor(storageLimitMB / avgStoragePerAccount) : 0;

      setStats({
        accountCount: accountCount || 0,
        imageCount: imageCount || 0,
        fileCount,
        totalStorageMB,
        totalStorageGB,
        avgDbPerAccount,
        avgStoragePerAccount,
        maxAccountsByDb,
        maxAccountsByStorage,
        dbLimitMB,
        storageLimitGB,
        remainingDbMB: dbLimitMB - (estimatedDbSizeKB / 1024),
        remainingStorageMB: storageLimitMB - totalStorageMB,
        estimatedDbSizeKB,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-red-500">Không thể tải dữ liệu</div>
        </div>
      </div>
    );
  }

  const maxAccounts = Math.min(stats.maxAccountsByDb, stats.maxAccountsByStorage);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Storage Calculator</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Current Stats */}
          <div className="bg-black/80 rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-white">Thống kê hiện tại</h2>
            <div className="space-y-3 text-white">
              <div className="flex justify-between">
                <span className="text-gray-400">Số tài khoản:</span>
                <span className="font-bold">{stats.accountCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Số ảnh (DB):</span>
                <span className="font-bold">{stats.imageCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Số files (Storage):</span>
                <span className="font-bold">{stats.fileCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Storage đã dùng:</span>
                <span className="font-bold">{stats.totalStorageMB.toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Storage đã dùng:</span>
                <span className="font-bold">{stats.totalStorageGB.toFixed(3)} GB</span>
              </div>
            </div>
          </div>

          {/* Averages */}
          <div className="bg-black/80 rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-white">Trung bình mỗi account</h2>
            <div className="space-y-3 text-white">
              <div className="flex justify-between">
                <span className="text-gray-400">Database (ước tính):</span>
                <span className="font-bold">{stats.avgDbPerAccount.toFixed(2)} KB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Storage:</span>
                <span className="font-bold">{stats.avgStoragePerAccount.toFixed(2)} MB</span>
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="bg-black/80 rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-white">Giới hạn Free Tier</h2>
            <div className="space-y-3 text-white">
              <div className="flex justify-between">
                <span className="text-gray-400">Database:</span>
                <span className="font-bold">{stats.dbLimitMB} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Storage:</span>
                <span className="font-bold">{stats.storageLimitGB} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Còn lại (DB):</span>
                <span className="font-bold text-green-400">{stats.remainingDbMB.toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Còn lại (Storage):</span>
                <span className="font-bold text-green-400">{stats.remainingStorageMB.toFixed(2)} MB</span>
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div className="bg-black/80 rounded-lg p-6 border border-yellow-400/50">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">Dự kiến số account</h2>
            <div className="space-y-3 text-white">
              <div className="flex justify-between">
                <span className="text-gray-400">Theo Database:</span>
                <span className="font-bold">{stats.maxAccountsByDb.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Theo Storage:</span>
                <span className="font-bold">{stats.maxAccountsByStorage.toLocaleString()}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-yellow-400">Tối đa (giới hạn chặt):</span>
                  <span className="text-2xl font-bold text-yellow-400">{maxAccounts.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  * Giới hạn chặt là giới hạn nhỏ hơn giữa Database và Storage
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/80 rounded-lg p-6 border border-white/20">
          <h2 className="text-xl font-bold mb-4 text-white">Khuyến nghị</h2>
          <div className="space-y-2 text-white text-sm">
            <p>• Với {stats.accountCount} accounts hiện tại, bạn có thể thêm khoảng <strong className="text-yellow-400">{(maxAccounts - stats.accountCount).toLocaleString()}</strong> accounts nữa.</p>
            <p>• Giới hạn chính: <strong className="text-yellow-400">Storage ({stats.maxAccountsByStorage < stats.maxAccountsByDb ? '1 GB' : '500 MB'})</strong></p>
            <p>• Để tối ưu: Nén ảnh, xóa ảnh không cần thiết, hoặc nâng cấp lên Pro ($25/tháng) để có 8 GB storage.</p>
          </div>
        </div>

        <button
          onClick={fetchStorageStats}
          className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
        >
          Làm mới dữ liệu
        </button>
      </div>
    </div>
  );
}