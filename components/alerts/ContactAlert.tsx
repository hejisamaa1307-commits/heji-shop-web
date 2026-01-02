"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

interface ContactAlertProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactAlert({ isOpen, onClose }: ContactAlertProps) {
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
        className="relative w-auto max-w-md mx-4 my-8"
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
            <h2 className="text-white text-xl font-bold mb-6 text-center">Liên hệ mua hàng</h2>
            <p className="text-gray-300 text-center mb-6 text-sm">
              Chọn phương thức liên hệ bạn muốn sử dụng:
            </p>

            {/* Social links */}
            <div className="flex flex-col gap-4">
              {/* ZALO */}
              <a
                href="https://zalo.me/g/fltldd910"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-lg border border-white/30 text-blue-400 hover:text-blue-300 font-bold transition-all"
              >
                <div className="bg-white/20 p-2 rounded">
                  <Image src="/images/zalo.svg" alt="Zalo" width={28} height={28} className="brightness-0 invert" />
                </div>
                <span className="text-lg">ZALO</span>
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/share/14NcPt3W8mx/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-lg border border-white/30 text-blue-400 hover:text-blue-300 font-bold transition-all"
              >
                <div className="bg-white/20 p-2 rounded">
                  <Image src="/images/facebook.svg" alt="Facebook" width={28} height={28} className="brightness-0 invert" />
                </div>
                <span className="text-lg">FACEBOOK</span>
              </a>
            </div>
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

