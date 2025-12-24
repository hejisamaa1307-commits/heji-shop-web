"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/app/lib/supabase";

interface BulkDeleteAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Account {
  id: string | number;
  title: string;
  price: string | number;
  main_acc: string | null;
  image_url: string;
  description?: string | null;
  created_at?: string;
}

export default function BulkDeleteAlert({ isOpen, onClose, onSuccess }: BulkDeleteAlertProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [availableOwners, setAvailableOwners] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editMainAcc, setEditMainAcc] = useState("");

  // Fetch all accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
      setSelectedIds(new Set());
      setMessage(null);
    }
  }, [isOpen]);

  // Reset form when closing
  useEffect(() => {
    if (!isOpen) {
      setAccounts([]);
      setSelectedIds(new Set());
      setMessage(null);
      setSelectedOwner("all");
      setSortBy("newest");
      setIsEditMode(false);
      setEditTitle("");
      setEditPrice("");
      setEditDesc("");
      setEditMainAcc("");
    }
  }, [isOpen]);

  // Extract unique owners when accounts change
  useEffect(() => {
    if (accounts.length > 0) {
      const owners = new Set<string>();
      accounts.forEach(acc => {
        if (acc.main_acc && acc.main_acc.trim() !== '') {
          owners.add(acc.main_acc.trim());
        }
      });
      const sortedOwners = Array.from(owners).sort();
      setAvailableOwners(sortedOwners);
    } else {
      setAvailableOwners([]);
    }
  }, [accounts]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts')
        .select('id, title, price, main_acc, image_url, description, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        setMessage({ type: "error", text: `Lỗi tải danh sách: ${error.message}` });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setAccounts(data || []);
      }
    } catch (error: any) {
      setMessage({ type: "error", text: "Đã xảy ra lỗi khi tải danh sách!" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string | number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    const filteredAccounts = getFilteredAccounts();
    const filteredIds = filteredAccounts.map(acc => acc.id);
    if (selectedIds.size === filteredIds.length && filteredIds.every(id => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIds));
    }
  };

  const getFilteredAccounts = () => {
    let filtered = accounts;
    
    // Filter by owner
    if (selectedOwner !== "all") {
      filtered = accounts.filter(acc => acc.main_acc && acc.main_acc.trim() === selectedOwner);
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          // Sort by created_at (newest first)
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        case 'oldest':
          const dateA2 = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB2 = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateA2 - dateB2;
        case 'price-low':
          const priceA = typeof a.price === 'number' ? a.price : parseFloat(String(a.price).replace(/k|K|,|\./g, '')) || 0;
          const priceB = typeof b.price === 'number' ? b.price : parseFloat(String(b.price).replace(/k|K|,|\./g, '')) || 0;
          return priceA - priceB;
        case 'price-high':
          const priceA2 = typeof a.price === 'number' ? a.price : parseFloat(String(a.price).replace(/k|K|,|\./g, '')) || 0;
          const priceB2 = typeof b.price === 'number' ? b.price : parseFloat(String(b.price).replace(/k|K|,|\./g, '')) || 0;
          return priceB2 - priceA2;
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '');
        default:
          return 0;
      }
    });
    
    return sorted;
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return price;
    return new Intl.NumberFormat('vi-VN').format(numPrice) + ' VNĐ';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return '1 ngày trước';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    // Format full date for older posts
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
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

  const handleOpenEdit = () => {
    if (selectedIds.size === 0) {
      setMessage({ type: "error", text: "Vui lòng chọn 1 tài khoản để sửa!" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (selectedIds.size > 1) {
      setMessage({ type: "error", text: "Vui lòng chỉ chọn 1 tài khoản để sửa!" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // Sửa 1 tài khoản - load thông tin
    const accountId = Array.from(selectedIds)[0];
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      setEditTitle(account.title);
      setEditPrice(String(account.price));
      setEditDesc(account.description || "");
      setEditMainAcc(account.main_acc || "");
      setIsEditMode(true);
    }
  };

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size !== 1) {
      setMessage({ type: "error", text: "Vui lòng chọn đúng 1 tài khoản để sửa!" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // Validation - cần title và price
    if (!editTitle.trim() || !editPrice.trim()) {
      setMessage({ type: "error", text: "Vui lòng điền đầy đủ tên tài khoản và giá!" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setEditing(true);
    setMessage(null);

    try {
      const accountId = Array.from(selectedIds)[0];
      
      const updateData: any = {
        title: editTitle.trim(),
        price: editPrice.trim().replace(/[kK,.\s]/g, ''),
        description: editDesc.trim() || null,
        main_acc: editMainAcc.trim() || null,
      };

      const { error: updateError } = await supabase
        .from("accounts")
        .update(updateData)
        .eq("id", accountId);

      if (updateError) {
        console.error(`Error updating account ${accountId}:`, updateError);
        setMessage({ 
          type: "error", 
          text: `Cập nhật thất bại: ${updateError.message}` 
        });
      } else {
        setMessage({ 
          type: "success", 
          text: `Đã cập nhật thành công tài khoản "${editTitle}"!` 
        });
        // Refresh accounts list
        await fetchAccounts();
        setIsEditMode(false);
        setEditTitle("");
        setEditPrice("");
        setEditDesc("");
        setEditMainAcc("");
        setSelectedIds(new Set());
        
        // Call onSuccess callback after delay
        setTimeout(() => {
          if (onSuccess) onSuccess();
          // Reload page to reflect changes
          window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      setMessage({ type: "error", text: `Đã xảy ra lỗi: ${error?.message || "Unknown error"}` });
    } finally {
      setEditing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      setMessage({ type: "error", text: "Vui lòng chọn ít nhất 1 tài khoản để xóa!" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const confirmMessage = `Bạn có chắc chắn muốn xóa ${selectedIds.size} tài khoản? Hành động này không thể hoàn tác!`;
    if (!confirm(confirmMessage)) {
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      const idsArray = Array.from(selectedIds);
      let successCount = 0;
      let failCount = 0;

      // Delete in batches to avoid overwhelming the database
      for (const id of idsArray) {
        try {
          // Get all image URLs for this account before deleting
          const { data: accountImages, error: fetchImagesError } = await supabase
            .from("account_images")
            .select("image_url")
            .eq("acc_id", id);

          if (fetchImagesError) {
            console.error(`Error fetching images for account ${id}:`, fetchImagesError);
          }

          // Get main image URL from account
          const { data: accountData } = await supabase
            .from("accounts")
            .select("image_url")
            .eq("id", id)
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
            console.error(`❌ Storage deletion failed for account ${id}: ${failedDeletions.length}/${imageUrls.length} files failed`);
            console.error(`Failed URLs:`, failedDeletions);
            failCount++;
            continue; // Skip this account - don't delete from DB if storage deletion failed
          }

          // All storage files deleted successfully, now delete from database
          console.log(`✅ All ${storageDeletedCount} files deleted from storage for account ${id}, proceeding with DB deletion`);

          // Delete account_images from database
          const { error: imagesError } = await supabase
            .from("account_images")
            .delete()
            .eq("acc_id", id);

          if (imagesError) {
            console.error(`Error deleting images for account ${id}:`, imagesError);
            failCount++;
            continue;
          }

          // Delete account from database
          const { error: deleteError } = await supabase
            .from("accounts")
            .delete()
            .eq("id", id);

          if (deleteError) {
            console.error(`Error deleting account ${id}:`, deleteError);
            failCount++;
          } else {
            successCount++;
            console.log(`✅ Successfully deleted account ${id}: ${storageDeletedCount}/${imageUrls.length} files deleted from storage and DB`);
          }
        } catch (error: any) {
          console.error(`Error deleting account ${id}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        setMessage({ 
          type: "success", 
          text: `Đã xóa thành công ${successCount} tài khoản${failCount > 0 ? ` (${failCount} thất bại)` : ''}!` 
        });
        // Refresh accounts list
        await fetchAccounts();
        setSelectedIds(new Set());
        
        // Call onSuccess callback after delay
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
          // Reload page to reflect changes
          window.location.reload();
        }, 2000);
      } else {
        setMessage({ 
          type: "error", 
          text: `Xóa thất bại! Không thể xóa bất kỳ tài khoản nào.` 
        });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: `Đã xảy ra lỗi: ${error?.message || "Unknown error"}` });
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md overflow-y-auto py-8"
      style={{ zIndex: 99999, position: 'fixed' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="relative w-auto max-w-6xl mx-4 my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-black dark:bg-black border-2 border-white/40 shadow-2xl relative p-6 rounded-2xl">
          {/* Nút đóng */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full hover:bg-black/70"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Nội dung Alert */}
          <div className="mt-4">
            <h2 className="text-white text-xl font-bold mb-6 text-center" style={{ fontFamily: 'var(--font-nosifer), sans-serif' }}>
              {isEditMode ? 'Sửa tài khoản' : 'Xóa tài khoản hàng loạt'}
            </h2>

            {message && (
              <div className={`mb-4 p-3 rounded-lg ${
                message.type === "success" 
                  ? "bg-green-900/30 text-green-300 border border-green-500/50" 
                  : "bg-red-900/30 text-red-300 border border-red-500/50"
              }`}>
                {message.text}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-white">Đang tải danh sách...</div>
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                Không có tài khoản nào
              </div>
            ) : isEditMode ? (
              /* Edit Form */
              <form onSubmit={handleBulkUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tên tài khoản
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-white/30 rounded-lg bg-black/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tên tài khoản"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Giá (VNĐ)
                  </label>
                  <input
                    type="text"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-white/30 rounded-lg bg-black/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập giá"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-white/30 rounded-lg bg-black/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Nhập mô tả"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Chủ tài khoản
                  </label>
                  <input
                    type="text"
                    value={editMainAcc}
                    onChange={(e) => setEditMainAcc(e.target.value)}
                    className="w-full px-4 py-2 border border-white/30 rounded-lg bg-black/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập chủ tài khoản"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setEditTitle("");
                      setEditPrice("");
                      setEditDesc("");
                      setEditMainAcc("");
                    }}
                    className="flex-1 px-4 py-2 border border-white/30 rounded-lg text-white hover:bg-white/10 transition-colors font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={editing}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editing ? 'Đang cập nhật...' : 'Cập nhật tài khoản'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Toolbar */}
                <div className="flex flex-col gap-3 mb-4">
                  {/* Filter by owner */}
                  <div className="p-3 bg-black/50 rounded-lg border border-white/20">
                    <label className="block text-white text-sm mb-2 font-medium">
                      🔍 Tìm theo chủ tài khoản:
                    </label>
                    <select
                      value={selectedOwner}
                      onChange={(e) => {
                        setSelectedOwner(e.target.value);
                        setSelectedIds(new Set()); // Reset selection when filter changes
                      }}
                      className="w-full px-4 py-2 bg-black/70 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-colors"
                    >
                      <option value="all">Tất cả ({accounts.length})</option>
                      {availableOwners.map((owner) => {
                        const count = accounts.filter(acc => acc.main_acc && acc.main_acc.trim() === owner).length;
                        return (
                          <option key={owner} value={owner}>
                            {owner} ({count})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Sort by */}
                  <div className="p-3 bg-black/50 rounded-lg border border-white/20">
                    <label className="block text-white text-sm mb-2 font-medium">
                      📊 Sắp xếp theo:
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setSelectedIds(new Set()); // Reset selection when sort changes
                      }}
                      className="w-full px-4 py-2 bg-black/70 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-colors"
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="oldest">Cũ nhất</option>
                      <option value="price-low">Giá: Thấp → Cao</option>
                      <option value="price-high">Giá: Cao → Thấp</option>
                      <option value="title-asc">Tên: A → Z</option>
                      <option value="title-desc">Tên: Z → A</option>
                    </select>
                  </div>

                  {/* Action toolbar */}
                  <div className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-white/20">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleSelectAll}
                        className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                      >
                        {(() => {
                          const filtered = getFilteredAccounts();
                          const filteredIds = filtered.map(acc => acc.id);
                          const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));
                          return allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả';
                        })()}
                      </button>
                      <span className="text-white text-sm">
                        Đã chọn: <span className="font-bold">{selectedIds.size}</span> / {getFilteredAccounts().length}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleOpenEdit}
                        disabled={selectedIds.size !== 1}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        title={selectedIds.size === 0 ? "Vui lòng chọn 1 tài khoản để sửa" : selectedIds.size > 1 ? "Chỉ có thể sửa 1 tài khoản mỗi lần" : "Sửa tài khoản đã chọn"}
                      >
                        Sửa tài khoản
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        disabled={deleting || selectedIds.size === 0}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleting ? `Đang xóa ${selectedIds.size}...` : `Xóa ${selectedIds.size > 0 ? selectedIds.size : ''} tài khoản`}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Accounts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                  {getFilteredAccounts().map((account) => {
                    const isSelected = selectedIds.has(account.id);
                    return (
                      <div
                        key={account.id}
                        onClick={() => toggleSelect(account.id)}
                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-red-500 bg-red-900/20'
                            : 'border-white/20 bg-black/50 hover:border-white/40'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="absolute top-2 right-2">
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'bg-red-600 border-red-600'
                              : 'bg-black/50 border-white/40'
                          }`}>
                            {isSelected && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Image */}
                        <div className="w-full aspect-square mb-3 rounded-lg overflow-hidden bg-black/50">
                          <img
                            src={account.image_url || '/images/bape.png'}
                            alt={account.title}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/bape.png';
                            }}
                          />
                        </div>

                        {/* Info */}
                        <div className="space-y-1">
                          <div className="text-white font-semibold text-sm truncate" title={account.title}>
                            {account.title}
                          </div>
                          <div className="text-green-400 font-medium text-sm">
                            {formatPrice(account.price)}
                          </div>
                          {account.main_acc && (
                            <div className="text-gray-400 text-xs truncate" title={account.main_acc}>
                              👤 {account.main_acc}
                            </div>
                          )}
                          <div className="text-gray-500 text-xs flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(account.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {getFilteredAccounts().length === 0 && selectedOwner !== "all" && (
                  <div className="text-center py-8 text-gray-400">
                    Không có tài khoản nào của chủ tài khoản "{selectedOwner}"
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

