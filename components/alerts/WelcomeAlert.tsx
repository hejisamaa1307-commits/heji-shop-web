"use client";

import { useEffect, useState } from 'react';
import { Alert } from "@heroui/alert";
import Image from 'next/image';

export default function WelcomeAlert() {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Kiểm tra xem đã hiển thị alert chưa
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowAlert(true);
      // Lưu vào localStorage để không hiển thị lại
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, []);

  if (!showAlert) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-auto">
        <Alert
          radius="lg"
          title="AE TỚI WEB HEJI SHOP ĐỂ MUA ĐƯỢC ACCOUNT GIÁ RẺ NHẤT NHA"
          className="bg-black dark:bg-black border-2 border-white/40 shadow-2xl relative p-6"
        >
          <button
            onClick={() => setShowAlert(false)}
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full hover:bg-black/70"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="mt-4 flex flex-col items-center gap-4">
            {/* Social links */}
            <div className="flex gap-6">
              {/* ZALO */}
              <a
                href="https://zalo.me/g/fltldd910"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/30 text-blue-400 hover:text-blue-300 font-bold transition-all"
              >
                <div className="bg-white/20 p-1 rounded">
                  <Image src="/images/zalo.svg" alt="Zalo" width={24} height={24} className="brightness-0 invert" />
                </div>
                ZALO
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/heji.sama.13722"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/30 text-blue-400 hover:text-blue-300 font-bold transition-all"
              >
                <div className="bg-white/20 p-1 rounded">
                  <Image src="/images/facebook.svg" alt="Facebook" width={24} height={24} className="brightness-0 invert" />
                </div>
                FB
              </a>
            </div>

            {/* Ảnh Zalo QR Code */}
            <div className="flex justify-center">
              <Image
                src="/images/boxzalo_1.png"
                alt="Zalo QR Code"
                width={350}
                height={350}
                className="rounded-lg"
                priority
              />
            </div>
          </div>
        </Alert>
      </div>
    </div>
  );
}

