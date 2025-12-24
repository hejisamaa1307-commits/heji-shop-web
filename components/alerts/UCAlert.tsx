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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-6">
      <Alert
        radius="lg"
        className="relative w-full max-w-5xl bg-black border border-white/30 shadow-2xl p-6 md:p-8"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
        >
          ✕
        </button>

        {/* HEADER */}
        <div className="text-center space-y-2">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            NẠP UC PUBG MOBILE
          </h2>
          <p className="text-white/80 text-sm md:text-base leading-relaxed">
            AE xem giá tham khảo <br className="md:hidden" />
            Mua thì IBX trực tiếp
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-6 flex justify-center gap-4">
          {/* ZALO */}
          <a
            href="https://zalo.me/g/fltldd910"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg
                       bg-blue-500/10 border border-blue-400/40
                       text-blue-300 font-semibold
                       hover:bg-blue-500/20 transition"
          >
            <Image
              src="/images/zalo.svg"
              alt="Zalo"
              width={22}
              height={22}
              className="invert"
            />
            ZALO
          </a>

          {/* FACEBOOK */}
          <a
            href="https://www.facebook.com/share/14NcPt3W8mx/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg
                       bg-blue-500/10 border border-blue-400/40
                       text-blue-300 font-semibold
                       hover:bg-blue-500/20 transition"
          >
            <Image
              src="/images/facebook.svg"
              alt="Facebook"
              width={22}
              height={22}
              className="invert"
            />
            FACEBOOK
          </a>
        </div>

        {/* CONTENT */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Image
            src="/images/anh_uc1.png"
            alt="Bảng giá UC"
            width={1000}
            height={1000}
            className="rounded-lg w-full h-auto"
            priority
          />

          <Image
            src="/images/profile1.png"
            alt="Profile"
            width={1000}
            height={1000}
            className="rounded-lg w-full h-auto"
            priority
          />
        </div>
      </Alert>
    </div>
  );
}
