"use client";

import { Alert } from "@heroui/alert";
import Image from "next/image";

interface UCAlertProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UCAlert({ isOpen, onClose }: UCAlertProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto py-8">
      <div className="relative w-auto max-w-6xl mx-4 my-8">
        <Alert 
          radius="lg" 
          className="bg-black dark:bg-black border-2 border-white/40 shadow-2xl relative p-6"
        >
          {/* nút đóng */}
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
          <div className="mt-4 flex flex-col items-center gap-4 text-center">
            <p className="text-white text-lg font-semibold leading-relaxed">
              Nạp UC PUBG MOBILE<br />
              AE XEM GIÁ THAM KHẢO AE MUA THÌ IBX THẲNG
            </p>

            {/* Social links */}
            <div className="flex gap-6 mt-2">
              {/* ZALO */}
              <a
                href="https://zalo.me/g/ayruet946"
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
                href="https://www.facebook.com/share/1BuyE1mxLT/?mibextid=wwXIfr"
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

            {/* Ảnh UC */}
            <div className="mt-4 flex justify-center">
              <Image 
                src="/images/anh_uc.jpg" 
                alt="Nạp UC PUBG MOBILE" 
                width={1050}
                height={1050}
                className="rounded-lg w-auto h-auto max-w-full"
                priority
              />
            </div>
          </div>
        </Alert>
      </div>
    </div>
  );
}
