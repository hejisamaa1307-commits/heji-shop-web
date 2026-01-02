"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import './page.css';
import Loading from '@/components/features/Loading';
import Card from '@/components/features/card';
import { useIsAdmin } from '@/app/lib/useIsAdmin';
import UpdateAccountAlert from '@/components/alerts/UpdateAccountAlert';

const ITEMS_PER_PAGE = 16;

export default function HomePage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<any[]>([]);
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

  // Update alert states
  const [isUpdateAlertOpen, setIsUpdateAlertOpen] = useState(false);
  const [accountToUpdate, setAccountToUpdate] = useState<any | null>(null);
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

    // Apply price filter (from filter bar or custom input)
    let priceFilter = selectedPriceRange || (selectedPrice !== 'any' ? selectedPrice : null);

    // Check if custom price is set
    if (customMinPrice.trim() || customMaxPrice.trim()) {
      // Parse custom price - support format like "5" (5 triệu), "5.5" (5.5 triệu), or "5000000" (VND)
      const parseCustomPrice = (priceStr: string): number => {
        const cleaned = priceStr.replace(/[kK,.\s]/g, '');
        const num = parseFloat(cleaned);
        if (isNaN(num)) return 0;
        // If number is small (< 10000), treat as triệu (million)
        // Otherwise treat as VND
        return num < 10000 ? num * 1000000 : num;
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

    // Apply sorting
    filtered.sort((a, b) => {
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
  }, [selectedPriceRange, selectedPrice, sortBy, verifiedOnly, accounts, customMinPrice, customMaxPrice]);


  async function fetchAccounts() {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('accounts')
        .select('id, title, price, image_url, created_at, main_acc, description')
        .order('created_at', { ascending: false });

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
    } catch (error: any) {
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
        accountImages.forEach((img: { image_url: string }) => {
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

      // Delete account_images from database
      const { error: imagesDeleteError } = await supabase
        .from("account_images")
        .delete()
        .eq("acc_id", accountId);

      if (imagesDeleteError) {
        console.error("Error deleting account_images:", imagesDeleteError);
        alert(`Lỗi khi xóa ảnh từ database: ${imagesDeleteError.message || "Unknown error"}`);
        return;
      }

      // Delete account from database
      const { error: deleteError } = await supabase
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
    } catch (error: any) {
      console.error("Unexpected error:", error);
      alert(`Đã xảy ra lỗi: ${error?.message || "Unknown error"}`);
    }
  };

  const handleOpenUpdateAlert = (account: any) => {
    if (!isAdmin) {
      return;
    }
    setAccountToUpdate(account);
    setUpdateTitle(account.title || "");
    setUpdatePrice(account.price || "");
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
      const updateData: any = {
        title: updateTitle.trim(),
        price: updatePrice.trim(),
        description: updateDesc.trim() || null,
        main_acc: updateMainAcc.trim() || null,
      };

      const { error: updateError } = await supabase
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
    } catch (error: any) {
      console.error("Unexpected error:", error);
      alert(`Đã xảy ra lỗi: ${error?.message || "Unknown error"}`);
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

        {/* Filter and Sort Bar */}
        <div className="mb-8 bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Price Filter */}
            <div className="relative">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Price: {selectedPrice === 'any' && !customMinPrice && !customMaxPrice ? 'Any' :
                  customMinPrice || customMaxPrice ? `Tùy chỉnh` :
                    selectedPrice === '1000000-5000000' ? '1 - 5 triệu' :
                      selectedPrice === '5000000-10000000' ? '5 - 10 triệu' :
                        selectedPrice === '10000000-20000000' ? '10 - 20 triệu' :
                          selectedPrice === '20000000-30000000' ? '20 - 30 triệu' :
                            selectedPrice === '30000000-50000000' ? '30 - 50 triệu' :
                              selectedPrice === '50000000-100000000' ? '50 - 100 triệu' :
                                selectedPrice === '100000000-500000000' ? '100 - 500 triệu' : 'Any'}
              </label>
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
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all appearance-none cursor-pointer mb-2"
              >
                <option value="any">Any</option>
                <option value="1000000-5000000">1 - 5 triệu</option>
                <option value="5000000-10000000">5 - 10 triệu</option>
                <option value="10000000-20000000">10 - 20 triệu</option>
                <option value="20000000-30000000">20 - 30 triệu</option>
                <option value="30000000-50000000">30 - 50 triệu</option>
                <option value="50000000-100000000">50 - 100 triệu</option>
                <option value="100000000-500000000">100 - 500 triệu</option>
              </select>
              {/* Custom Price Input */}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={customMinPrice}
                  onChange={(e) => {
                    setCustomMinPrice(e.target.value);
                    setSelectedPrice('any');
                    setSelectedPriceRange(null);
                  }}
                  placeholder="Từ (triệu)"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                />
                <input
                  type="text"
                  value={customMaxPrice}
                  onChange={(e) => {
                    setCustomMaxPrice(e.target.value);
                    setSelectedPrice('any');
                    setSelectedPriceRange(null);
                  }}
                  placeholder="Đến (triệu)"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                />
              </div>
              {(customMinPrice || customMaxPrice) && (
                <p className="text-xs text-gray-400 mt-1">
                  Ví dụ: 5 = 5 triệu, 10.5 = 10.5 triệu
                </p>
              )}
            </div>

            {/* Sort By */}
            <div className="relative">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Sort By: {sortBy === 'popular' ? 'Popular' : sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : sortBy === 'price-low' ? 'Price: Low to High' : 'Price: High to Low'}</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all appearance-none cursor-pointer"
              >
                <option value="popular">Popular</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* Verified Only Toggle */}
            <div className="flex flex-col justify-end">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Verified Only</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{verifiedOnly ? 'On' : 'Off'}</span>
                <button
                  type="button"
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${verifiedOnly ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${verifiedOnly ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Accounts Grid */}
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
                  imageUrl={acc.image_url}
                  title={acc.title || 'Không có tiêu đề'}
                  description={acc.description}
                  price={acc.price}
                  id={acc.id}
                  createdAt={acc.created_at}
                  href={`/account/${acc.id}`}
                  mainAcc={acc.main_acc}
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
