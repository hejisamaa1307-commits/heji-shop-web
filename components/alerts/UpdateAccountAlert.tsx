"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface UpdateAccountAlertProps {
  isOpen: boolean;
  onClose: () => void;
  account: any | null;
  updateTitle: string;
  setUpdateTitle: (value: string) => void;
  updatePrice: string;
  setUpdatePrice: (value: string) => void;
  updateDesc: string;
  setUpdateDesc: (value: string) => void;
  updateMainAcc: string;
  setUpdateMainAcc: (value: string) => void;
  loadingUpdate: boolean;
  onUpdate: (e: React.FormEvent) => void;
}

export default function UpdateAccountAlert({
  isOpen,
  onClose,
  account,
  updateTitle,
  setUpdateTitle,
  updatePrice,
  setUpdatePrice,
  updateDesc,
  setUpdateDesc,
  updateMainAcc,
  setUpdateMainAcc,
  loadingUpdate,
  onUpdate,
}: UpdateAccountAlertProps) {
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

  if (!isOpen || !account) return null;

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
        className="relative w-auto max-w-md mx-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-black dark:bg-black border-2 border-white/40 shadow-2xl relative p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
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
              Cập nhật tài khoản
            </h2>

            <form onSubmit={onUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tên tài khoản
                </label>
                <input
                  type="text"
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
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
                  value={updatePrice}
                  onChange={(e) => setUpdatePrice(e.target.value)}
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
                  value={updateDesc}
                  onChange={(e) => setUpdateDesc(e.target.value)}
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
                  value={updateMainAcc}
                  onChange={(e) => setUpdateMainAcc(e.target.value)}
                  className="w-full px-4 py-2 border border-white/30 rounded-lg bg-black/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập chủ tài khoản"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-white/30 rounded-lg text-white hover:bg-white/10 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loadingUpdate}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingUpdate ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </form>
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

