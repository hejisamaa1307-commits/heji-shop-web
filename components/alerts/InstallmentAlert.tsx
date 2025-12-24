"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { InstallmentCalculator } from "../features/InstallmentCalculator";

interface InstallmentAlertProps {
  isOpen: boolean;
  onClose: () => void;
  accountPrice: number | string;
  downPayment: string;
  setDownPayment: (value: string) => void;
  installmentMonths: number;
  setInstallmentMonths: (value: number) => void;
}

export default function InstallmentAlert({
  isOpen,
  onClose,
  accountPrice,
  downPayment,
  setDownPayment,
  installmentMonths,
  setInstallmentMonths,
}: InstallmentAlertProps) {
  // Debug log
  useEffect(() => {
    console.log('InstallmentAlert isOpen:', isOpen);
  }, [isOpen]);

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

  console.log('InstallmentAlert render, isOpen:', isOpen);

  if (!isOpen) {
    console.log('InstallmentAlert: not rendering because isOpen is false');
    return null;
  }

  console.log('InstallmentAlert: rendering modal');

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md overflow-y-auto py-8"
      style={{ zIndex: 99999, position: 'fixed' }}
      onClick={(e) => {
        // Close when clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="relative w-auto max-w-3xl mx-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-black dark:bg-black border-2 border-white/40 shadow-2xl relative p-4 sm:p-6 rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
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
          <div className="mt-4 flex-1 overflow-y-auto">
            <h2 className="text-white text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center" style={{ fontFamily: 'var(--font-nosifer), sans-serif' }}>Tính lãi góp</h2>
            <InstallmentCalculator 
              accountPrice={accountPrice}
              downPayment={downPayment}
              setDownPayment={setDownPayment}
              installmentMonths={installmentMonths}
              setInstallmentMonths={setInstallmentMonths}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render outside the component tree
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

