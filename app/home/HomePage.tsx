"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import './page.css';
import Loading from '@/components/features/Loading';
import Card from '@/components/features/card';
import { useIsAdmin } from '@/app/lib/useIsAdmin';
import UpdateAccountAlert from '@/components/alerts/UpdateAccountAlert';

const ITEMS_PER_PAGE = 16;

type Account = {
  id: string | number;
  title: string | null;
  price: number | string;
  image_url: string | null;
  created_at: string | null;
  main_acc: string | null;
  description: string | null;
};

type UpdateAccountPayload = {
  title: string;
  price: string;
  description: string | null;
  main_acc: string | null;
};

// Danh sách chủ tài khoản ưu tiên (sẽ hiển thị lên đầu)
const PRIORITY_OWNERS = ['Phát', 'Huy', 'Hiếu'].map(name => name.toLowerCase().trim());

export default function HomePage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { isAdmin } = useIsAdmin();

  // New filter states
  const [selectedPrice, setSelectedPrice] = useState<string>('any');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [customMinPrice, setCustomMinPrice] = useState<string>('');
  const [customMaxPrice, setCustomMaxPrice] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Update alert states
  const [isUpdateAlertOpen, setIsUpdateAlertOpen] = useState(false);
  const [accountToUpdate, setAccountToUpdate] = useState<Account | null>(null);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updatePrice, setUpdatePrice] = useState("");
  const [updateDesc, setUpdateDesc] = useState("");
  const [updateMainAcc, setUpdateMainAcc] = useState("");
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Apply all filters and sorting
  useEffect(() => {
    let filtered = [...accounts];

    // Apply ID search filter first (highest priority)
    if (searchId.trim()) {
      const searchIdValue = searchId.trim();
      filtered = filtered.filter(acc => {
        const accId = String(acc.id);
        return accId.includes(searchIdValue) || accId === searchIdValue;
      });
    }

    // Apply price filter (from filter bar or custom input)
    let priceFilter = selectedPriceRange || (selectedPrice !== 'any' ? selectedPrice : null);

    // Check if custom price is set
    if (customMinPrice.trim() || customMaxPrice.trim()) {
      // Parse custom price - support format like "5" (5 triệu), "5.5" (5.5 triệu), or "5000000" (VND)
      const parseCustomPrice = (priceStr: string): number => {
        // Remove spaces and 'k/K' but keep dots and commas for decimal parsing
        const cleaned = priceStr.replace(/[kK\s]/g, '').replace(/,/g, '.');
        const num = parseFloat(cleaned);
        if (isNaN(num)) return 0;
        // If number is small (< 1000), treat as triệu (million)
        // Otherwise treat as VND
        return num < 1000 ? num * 1000000 : num;
      };

      const min = customMinPrice.trim() ? parseCustomPrice(customMinPrice) : 0;
      const max = customMaxPrice.trim() ? parseCustomPrice(customMaxPrice) : 999999999;

      if (!isNaN(min) && !isNaN(max) && min >= 0 && max >= min) {
        priceFilter = `${min}-${max}`;
      }
    }

    if (priceFilter) {
      const [min, max] = priceFilter.split('-').map(Number);
      filtered = filtered.filter(acc => {
        let price = 0;
        if (typeof acc.price === 'number') {
          price = acc.price;
        } else if (typeof acc.price === 'string') {
          // Parse price string (remove k, K, commas, dots)
          const priceStr = acc.price.replace(/k|K|,|\./g, '');
          price = parseFloat(priceStr) || 0;
        }
        // Filter: price >= min && price <= max
        return price >= min && (max === 999999999 || price <= max);
      });
    }

    // Apply verified filter (all accounts are verified for now)
    if (verifiedOnly) {
      // All accounts are verified, no filtering needed
    }

    // Apply sorting với ưu tiên chủ tài khoản
    filtered.sort((a, b) => {
      // Kiểm tra xem tài khoản có trong danh sách ưu tiên không
      const mainAccA = (a.main_acc || '').toLowerCase().trim();
      const mainAccB = (b.main_acc || '').toLowerCase().trim();

      // Kiểm tra xem main_acc có chứa tên ưu tiên không (cho phép match một phần)
      const getPriorityIndex = (mainAcc: string): number => {
        for (let i = 0; i < PRIORITY_OWNERS.length; i++) {
          if (mainAcc.includes(PRIORITY_OWNERS[i]) || PRIORITY_OWNERS[i].includes(mainAcc)) {
            return i;
          }
        }
        return -1; // Không phải ưu tiên
      };

      const priorityIndexA = getPriorityIndex(mainAccA);
      const priorityIndexB = getPriorityIndex(mainAccB);
      const isPriorityA = priorityIndexA !== -1;
      const isPriorityB = priorityIndexB !== -1;

      // Nếu một trong hai là ưu tiên, đưa lên đầu
      if (isPriorityA && !isPriorityB) {
        return -1; // a lên trước
      }
      if (!isPriorityA && isPriorityB) {
        return 1; // b lên trước
      }

      // Nếu cả hai đều ưu tiên, sắp xếp theo thứ tự trong danh sách ưu tiên
      if (isPriorityA && isPriorityB) {
        if (priorityIndexA !== priorityIndexB) {
          return priorityIndexA - priorityIndexB; // Sắp xếp theo thứ tự trong danh sách
        }
      }

      // Sau đó áp dụng sorting theo tiêu chí đã chọn
      switch (sortBy) {
        case 'popular':
          // Sort by created_at (newest first)
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        case 'price-low':
          const priceA = typeof a.price === 'number' ? a.price : parseFloat(String(a.price).replace(/k|K|,|\./g, '')) || 0;
          const priceB = typeof b.price === 'number' ? b.price : parseFloat(String(b.price).replace(/k|K|,|\./g, '')) || 0;
          return priceA - priceB;
        case 'price-high':
          const priceA2 = typeof a.price === 'number' ? a.price : parseFloat(String(a.price).replace(/k|K|,|\./g, '')) || 0;
          const priceB2 = typeof b.price === 'number' ? b.price : parseFloat(String(b.price).replace(/k|K|,|\./g, '')) || 0;
          return priceB2 - priceA2;
        case 'newest':
          const dateA2 = new Date(a.created_at || 0).getTime();
          const dateB2 = new Date(b.created_at || 0).getTime();
          return dateB2 - dateA2;
        case 'oldest':
          const dateA3 = new Date(a.created_at || 0).getTime();
          const dateB3 = new Date(b.created_at || 0).getTime();
          return dateA3 - dateB3;
        default:
          return 0;
      }
    });

    setFilteredAccounts(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [selectedPriceRange, selectedPrice, sortBy, verifiedOnly, accounts, customMinPrice, customMaxPrice, searchId]);


  async function fetchAccounts() {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('accounts')
        .select('id, title, price, image_url, created_at, main_acc, description')
        .order('created_at', { ascending: false })
        .limit(2000); // Tăng limit lên 2000 accounts

      if (error) {
        setError('Không thể tải danh sách tài khoản');
        console.error(error);
      } else {
        const accountsData = data || [];
        setAccounts(accountsData);
        setFilteredAccounts(accountsData);
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi tải dữ liệu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentAccounts = useMemo(() => {
    return filteredAccounts.slice(startIndex, endIndex);
  }, [filteredAccounts, startIndex, endIndex]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper function to delete file from Supabase Storage via API
  const deleteFileFromStorage = async (imageUrl: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/delete-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error deleting file from storage:', imageUrl, data.error);
        return false;
      }

      return true;
    } catch (error: unknown) {
      console.error('Error deleting file from storage:', imageUrl, error);
      return false;
    }
  };

  const handleDeleteAccount = async (accountId: string | number, accountTitle: string) => {
    if (!isAdmin) {
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${accountTitle}"? Hành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      // Get all image URLs for this account before deleting
      const { data: accountImages, error: fetchImagesError } = await supabase
        .from("account_images")
        .select("image_url")
        .eq("acc_id", accountId);

      if (fetchImagesError) {
        console.error(`Error fetching images for account ${accountId}:`, fetchImagesError);
      }

      // Get main image URL from account
      const { data: accountData } = await supabase
        .from("accounts")
        .select("image_url")
        .eq("id", accountId)
        .single();

      // Collect all image URLs to delete
      const imageUrls: string[] = [];
      if (accountImages) {
        accountImages.forEach((img: { image_url: string | null }) => {
          if (img.image_url) imageUrls.push(img.image_url);
        });
      }
      if (accountData?.image_url && !imageUrls.includes(accountData.image_url)) {
        imageUrls.push(accountData.image_url);
      }

      // Delete files from storage first - CRITICAL: Must delete all files before deleting DB
      let storageDeletedCount = 0;
      const failedDeletions: string[] = [];

      for (const imageUrl of imageUrls) {
        const deleted = await deleteFileFromStorage(imageUrl);
        if (deleted) {
          storageDeletedCount++;
        } else {
          failedDeletions.push(imageUrl);
          console.error(`❌ Failed to delete file from storage: ${imageUrl}`);
        }
      }

      // CRITICAL: Only proceed with DB deletion if ALL storage files are deleted
      if (failedDeletions.length > 0) {
        const errorMsg = `❌ Không thể xóa ${failedDeletions.length}/${imageUrls.length} file từ storage!\n\n` +
          `Vui lòng kiểm tra lại. Tài khoản chưa được xóa để tránh mất dữ liệu.`;
        console.error(`❌ Storage deletion failed for account ${accountId}:`, failedDeletions);
        alert(errorMsg);
        return; // STOP - Don't delete from DB if storage deletion failed
      }

      // All storage files deleted successfully, now delete from database
      console.log(`✅ All ${storageDeletedCount} files deleted from storage, proceeding with DB deletion`);

      // Use admin client if available to ensure deletion succeeds (RLS bypass)
      const dbClient = supabaseAdmin || supabase;

      // Delete account_images from database
      const { error: imagesDeleteError } = await dbClient
        .from("account_images")
        .delete()
        .eq("acc_id", accountId);

      if (imagesDeleteError) {
        console.error("Error deleting account_images:", imagesDeleteError);
        alert(`Lỗi khi xóa ảnh từ database: ${imagesDeleteError.message || "Unknown error"}`);
        return;
      }

      // Delete account from database
      const { error: deleteError } = await dbClient
        .from("accounts")
        .delete()
        .eq("id", accountId);

      if (deleteError) {
        console.error("Error deleting account:", deleteError);
        alert(`Lỗi khi xóa tài khoản: ${deleteError.message || "Unknown error"}`);
        return;
      }

      // Cập nhật danh sách accounts
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      setFilteredAccounts(prev => prev.filter(acc => acc.id !== accountId));

      console.log(`✅ Successfully deleted account ${accountId}: ${storageDeletedCount}/${imageUrls.length} files deleted from storage and DB`);
      alert(`Đã xóa thành công tài khoản "${accountTitle}"!`);
    } catch (error: unknown) {
      console.error("Unexpected error:", error);
      alert(`Đã xảy ra lỗi: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleOpenUpdateAlert = (account: Account) => {
    if (!isAdmin) {
      return;
    }
    setAccountToUpdate(account);
    setUpdateTitle(account.title || "");
    setUpdatePrice(String(account.price || ""));
    setUpdateDesc(account.description || "");
    setUpdateMainAcc(account.main_acc || "");
    setIsUpdateAlertOpen(true);
  };

  const handleCloseUpdateAlert = () => {
    setIsUpdateAlertOpen(false);
    setAccountToUpdate(null);
    setUpdateTitle("");
    setUpdatePrice("");
    setUpdateDesc("");
    setUpdateMainAcc("");
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountToUpdate || !isAdmin) {
      return;
    }

    setLoadingUpdate(true);

    try {
      const updateData: UpdateAccountPayload = {
        title: updateTitle.trim(),
        price: updatePrice.trim(),
        description: updateDesc.trim() || null,
        main_acc: updateMainAcc.trim() || null,
      };

      const dbClient = supabaseAdmin || supabase;

      const { error: updateError } = await dbClient
        .from("accounts")
        .update(updateData)
        .eq("id", accountToUpdate.id);

      if (updateError) {
        console.error("Error updating account:", updateError);
        alert(`Lỗi khi cập nhật tài khoản: ${updateError.message || "Unknown error"}`);
        setLoadingUpdate(false);
        return;
      }

      // Cập nhật danh sách accounts
      setAccounts(prev => prev.map(acc =>
        acc.id === accountToUpdate.id
          ? { ...acc, ...updateData }
          : acc
      ));
      setFilteredAccounts(prev => prev.map(acc =>
        acc.id === accountToUpdate.id
          ? { ...acc, ...updateData }
          : acc
      ));

      alert(`Đã cập nhật thành công tài khoản "${updateTitle}"!`);
      handleCloseUpdateAlert();
    } catch (error: unknown) {
      console.error("Unexpected error:", error);
      alert(`Đã xảy ra lỗi: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoadingUpdate(false);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-black dark:via-black dark:to-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 dark:text-red-400 font-semibold text-lg mb-4">{error}</p>
              <button
                onClick={fetchAccounts}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen home-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-6 animate-fade-in">
          <p className="text-gray-600 dark:text-gray-400 text-lg" style={{ fontFamily: 'var(--font-nosifer), sans-serif' }}>
            Tìm thấy <span className="font-semibold text-white dark:text-white">{filteredAccounts.length}</span> tài khoản
          </p>
        </div>

        {/* Professional Filter and Sort Bar - Collapsible Dark Theme */}
        <div className="mb-8 relative">
          {/* Background container */}
          <div className="relative overflow-hidden rounded-2xl">
            {/* Background with dark glassmorphism effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-900 rounded-2xl" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-cyan-500/5 rounded-2xl" />
            <div className="absolute inset-0 backdrop-blur-xl bg-black/80 rounded-2xl" />

            {/* Subtle border gradient */}
            <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-gray-700/50 via-gray-600/30 to-gray-700/50" style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />

            {/* Toggle Header - Always Visible */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="relative w-full p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600/50 shadow-lg">
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-bold text-white">Tìm kiếm acc theo giá</h3>
                <p className="text-xs text-gray-500">Bấm để {isFilterOpen ? 'thu gọn' : 'mở rộng'} bộ lọc</p>
              </div>

              {/* Active filters count badge */}
              {(searchId || selectedPrice !== 'any' || customMinPrice || customMaxPrice || verifiedOnly) && (
                <span className="px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-gray-600 to-gray-700 border border-gray-500/30 rounded-full shadow-lg">
                  {[searchId, selectedPrice !== 'any' || customMinPrice || customMaxPrice, verifiedOnly].filter(Boolean).length} bộ lọc
                </span>
              )}

              {/* Arrow indicator */}
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 border border-gray-700 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Collapsible Content */}
            <div
              className={`relative overflow-hidden transition-all duration-300 ease-in-out ${isFilterOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
              <div className="p-6 pt-2 border-t border-gray-800">
                {/* Clear all button */}
                {(searchId || selectedPrice !== 'any' || customMinPrice || customMaxPrice || verifiedOnly) && (
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => {
                        setSearchId('');
                        setSelectedPrice('any');
                        setSelectedPriceRange(null);
                        setCustomMinPrice('');
                        setCustomMaxPrice('');
                        setVerifiedOnly(false);
                      }}
                      className="px-3 py-1 text-xs font-medium text-gray-400 bg-gray-800 hover:bg-red-900/50 hover:text-red-400 border border-gray-700 hover:border-red-800 rounded-full transition-all duration-200"
                    >
                      🗑️ Xóa tất cả bộ lọc
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Search by ID - Dark Theme */}
                  <div className="group">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      Tìm theo ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-500 group-focus-within:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="Nhập ID tài khoản..."
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-700 bg-gray-900/90 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-600/20 transition-all duration-200 text-sm font-medium"
                      />
                      {searchId && (
                        <button
                          onClick={() => setSearchId('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {searchId && (
                      <p className="mt-1 text-xs text-gray-400 font-medium">
                        🔍 Đang tìm ID chứa &quot;{searchId}&quot;
                      </p>
                    )}
                  </div>

                  {/* Price Filter - Dark Theme */}
                  <div className="group">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Khoảng giá
                    </label>
                    <div className="relative">
                      <select
                        value={selectedPrice}
                        onChange={(e) => {
                          setSelectedPrice(e.target.value);
                          if (e.target.value === 'any') {
                            setSelectedPriceRange(null);
                            setCustomMinPrice('');
                            setCustomMaxPrice('');
                          } else {
                            setSelectedPriceRange(e.target.value);
                            setCustomMinPrice('');
                            setCustomMaxPrice('');
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-900/90 text-gray-100 focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-600/20 transition-all duration-200 appearance-none cursor-pointer text-sm font-medium"
                      >
                        <option value="any">Tất cả mức giá</option>
                        <option value="1000000-5000000">💰 1 - 5 triệu</option>
                        <option value="5000000-10000000">💰 5 - 10 triệu</option>
                        <option value="10000000-20000000">💎 10 - 20 triệu</option>
                        <option value="20000000-30000000">💎 20 - 30 triệu</option>
                        <option value="30000000-50000000">👑 30 - 50 triệu</option>
                        <option value="50000000-100000000">👑 50 - 100 triệu</option>
                        <option value="100000000-500000000">🔥 100 - 500 triệu</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Custom Price Input - Dark Theme */}
                    <div className="flex gap-2 mt-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={customMinPrice}
                          onChange={(e) => {
                            setCustomMinPrice(e.target.value);
                            setSelectedPrice('any');
                            setSelectedPriceRange(null);
                          }}
                          placeholder="Từ"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-700 bg-gray-900/90 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-600/20 transition-all"
                        />
                      </div>
                      <span className="flex items-center text-gray-600">—</span>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={customMaxPrice}
                          onChange={(e) => {
                            setCustomMaxPrice(e.target.value);
                            setSelectedPrice('any');
                            setSelectedPriceRange(null);
                          }}
                          placeholder="Đến"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-700 bg-gray-900/90 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-600/20 transition-all"
                        />
                      </div>
                    </div>
                    {(customMinPrice || customMaxPrice) && (
                      <p className="text-xs text-gray-400 mt-1 font-medium">
                        💡 Ví dụ: 5 = 5 triệu, 10.5 = 10.5 triệu
                      </p>
                    )}
                  </div>

                  {/* Sort By - Dark Theme */}
                  <div className="group">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                      Sắp xếp theo
                    </label>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-900/90 text-gray-100 focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-600/20 transition-all duration-200 appearance-none cursor-pointer text-sm font-medium"
                      >
                        <option value="popular">🔥 Phổ biến nhất</option>
                        <option value="newest">✨ Mới nhất</option>
                        <option value="oldest">📅 Cũ nhất</option>
                        <option value="price-low">📉 Giá thấp → cao</option>
                        <option value="price-high">📈 Giá cao → thấp</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Verified Only Toggle - Dark Theme */}
                  <div className="group">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Đã xác thực
                    </label>
                    <button
                      type="button"
                      onClick={() => setVerifiedOnly(!verifiedOnly)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 ${verifiedOnly
                        ? 'border-green-600/50 bg-green-900/20 text-green-400'
                        : 'border-gray-700 bg-gray-900/90 text-gray-400 hover:border-gray-600'
                        }`}
                    >
                      <span className="text-sm font-medium">
                        {verifiedOnly ? '✅ Đang bật' : 'Tất cả tài khoản'}
                      </span>
                      <div className={`relative w-12 h-6 rounded-full transition-all duration-300 ${verifiedOnly
                        ? 'bg-gradient-to-r from-green-600 to-green-500 shadow-lg shadow-green-500/20'
                        : 'bg-gray-700'
                        }`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${verifiedOnly ? 'left-7' : 'left-1'
                          }`} />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Quick filter tags - Dark Theme */}
                <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-800">
                  <span className="text-xs text-gray-500 mr-2 self-center">Lọc nhanh:</span>
                  {[
                    { label: 'Dưới 5 triệu', value: '1000000-5000000', emoji: '💰' },
                    { label: '5-10 triệu', value: '5000000-10000000', emoji: '💎' },
                    { label: 'Mới nhất', sort: 'newest', emoji: '✨' },
                    { label: 'Giá rẻ nhất', sort: 'price-low', emoji: '📉' },
                  ].map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (tag.value) {
                          setSelectedPrice(tag.value);
                          setSelectedPriceRange(tag.value);
                          setCustomMinPrice('');
                          setCustomMaxPrice('');
                        }
                        if (tag.sort) {
                          setSortBy(tag.sort);
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 hover:scale-105 ${(tag.value && selectedPrice === tag.value) || (tag.sort && sortBy === tag.sort)
                        ? 'bg-white text-gray-900 shadow-lg'
                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-gray-300'
                        }`}
                    >
                      {tag.emoji} {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {filteredAccounts.length === 0 && accounts.length > 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-black mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
              Không tìm thấy tài khoản trong khoảng giá này
            </p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-black mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">Chưa có tài khoản nào</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
              {currentAccounts.map((acc) => (
                <Card
                  key={acc.id}
                  imageUrl={acc.image_url ?? undefined}
                  title={acc.title || 'Không có tiêu đề'}
                  description={acc.description ?? undefined}
                  price={acc.price}
                  id={acc.id}
                  createdAt={acc.created_at ?? undefined}
                  href={`/account/${acc.id}`}
                  mainAcc={acc.main_acc ?? undefined}
                  isAdmin={isAdmin}
                  onUpdate={isAdmin ? () => handleOpenUpdateAlert(acc) : undefined}
                  onDelete={isAdmin ? () => handleDeleteAccount(acc.id, acc.title || 'Không có tiêu đề') : undefined}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Hiển thị <span className="font-semibold text-gray-900 dark:text-white">{startIndex + 1}</span> -{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.min(endIndex, filteredAccounts.length)}
                  </span>{' '}
                  trong tổng số <span className="font-semibold text-gray-900 dark:text-white">{filteredAccounts.length}</span> tài khoản
                </div>

                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${index}`} className="px-2 text-gray-500 dark:text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page as number)}
                          className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 min-w-[2.5rem] ${currentPage === page
                            ? 'bg-black text-white shadow-lg scale-105'
                            : 'bg-white dark:bg-black text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Update Account Alert */}
      <UpdateAccountAlert
        isOpen={isUpdateAlertOpen}
        onClose={handleCloseUpdateAlert}
        account={accountToUpdate}
        updateTitle={updateTitle}
        setUpdateTitle={setUpdateTitle}
        updatePrice={updatePrice}
        setUpdatePrice={setUpdatePrice}
        updateDesc={updateDesc}
        setUpdateDesc={setUpdateDesc}
        updateMainAcc={updateMainAcc}
        setUpdateMainAcc={setUpdateMainAcc}
        loadingUpdate={loadingUpdate}
        onUpdate={handleUpdateAccount}
      />
    </div>
  );
}
