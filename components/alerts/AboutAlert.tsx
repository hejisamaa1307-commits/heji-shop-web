"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import "./AboutAlert.css";

interface AboutAlertProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutAlert({ isOpen, onClose }: AboutAlertProps) {
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
        className="relative w-auto max-w-5xl mx-4 my-8 max-h-[90vh] overflow-y-auto"
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

          {/* Nội dung About */}
          <div className="mt-4">
            <h1 className="about-title">Về chúng tôi</h1>

            <div className="about-content">
              {/* Thông tin liên hệ */}
              <section className="about-section">
                <h2 className="about-section-title">Thông tin liên hệ</h2>
                <div className="about-info">
                  <div className="about-contact-grid">
                    <div className="about-contact-item">
                      <Image
                        src="/images/facebook.svg"
                        alt="Facebook"
                        width={32}
                        height={32}
                        className="about-contact-icon"
                      />
                      <div className="text-center">
                        <p className="font-semibold text-white mb-2">Facebook chính</p>
                        <a
                          href="https://www.facebook.com/share/1BuyE1mxLT/?mibextid=wwXIfr"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Image
                            src="/images/about/fb_chinh.png"
                            alt="Facebook chính"
                            width={200}
                            height={200}
                            className="about-qr-image hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        </a>
                      </div>
                    </div>

                    <div className="about-contact-item">
                      <Image
                        src="/images/zalo.svg"
                        alt="Zalo"
                        width={32}
                        height={32}
                        className="about-contact-icon"
                      />
                      <div className="text-center">
                        <p className="font-semibold text-white mb-2">Zalo</p>
                        <a
                          href="https://zalo.me/g/ayruet946"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Image
                            src="/images/about/boxzalo.png"
                            alt="Zalo QR"
                            width={200}
                            height={200}
                            className="about-qr-image hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="about-bank-info">
                    <p className="font-semibold text-white mb-2">Thông tin tài khoản ngân hàng:</p>
                    <Image
                      src="/images/about/stk.png"
                      alt="Số tài khoản ngân hàng"
                      width={400}
                      height={300}
                      className="about-bank-image"
                    />
                  </div>
                </div>
              </section>

              {/* Dịch vụ trả góp */}
              <section className="about-section">
                <h2 className="about-section-title">Dịch vụ trả góp</h2>
                <div className="about-info">
                  <div className="about-service-images">
                    <div className="about-image-item">
                      <Image
                        src="/images/about/dichvugop.jpg"
                        alt="Dịch vụ góp"
                        width={600}
                        height={800}
                        className="about-service-image"
                      />
                    </div>
                    <div className="about-image-item">
                      <Image
                        src="/images/about/luat_gop.jpg"
                        alt="Luật góp"
                        width={600}
                        height={800}
                        className="about-service-image"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Hướng dẫn */}
              <section className="about-section">
                <h2 className="about-section-title">Hướng dẫn</h2>
                <div className="about-info">
                  <div className="about-guide-item">
                    <h3 className="text-white font-semibold mb-2">Cách thay GCT</h3>
                    <Image
                      src="/images/about/cach_thay_gct.jpg"
                      alt="Cách thay GCT"
                      width={600}
                      height={800}
                      className="about-guide-image"
                    />
                  </div>
                </div>
              </section>
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

