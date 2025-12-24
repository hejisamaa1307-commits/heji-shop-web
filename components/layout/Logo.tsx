"use client";

import Image from "next/image";

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 h-full ${className}`}>
      {/* Logo ảnh bên trái */}
      <div className="relative flex-shrink-0 h-full flex items-center">
        <Image
          src="/images/logo_3.png"
          alt="HEJI SHOP ACC Logo"
          width={100}
          height={100}
          className="object-contain h-full w-auto max-h-full"
          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
        />
      </div>

      {/* Text và Slogan */}
      <div className="flex flex-col justify-center h-full py-1">
        {/* Text chính - HEJI SHOP ACC */}
        <span
          className="text-xl md:text-2xl font-bold uppercase tracking-wide text-white leading-tight"
          style={{
            fontFamily: "var(--font-nosifer), sans-serif"
          }}
        >
          HEJI SHOP ACC
        </span>

        {/* Slogan */}
        <span className="text-xs md:text-sm uppercase tracking-wider text-gray-300 mt-0.5 leading-tight">
          Uy Tín - Chất Lượng - Nhiệt Tình
        </span>
      </div>
    </div>
  );
}

