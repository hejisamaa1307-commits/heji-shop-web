"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import HomePage from "./home/HomePage";
import Navbar from "../components/layout/navbar";
import WelcomeAlert from "../components/alerts/WelcomeAlert";

const Snowfall = dynamic(() => import('react-snowfall'), {
  ssr: false,
});

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative">
      {mounted && (
        <Snowfall
          style={{
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            zIndex: 1,
            pointerEvents: 'none'
          }}
          snowflakeCount={200}
          color="#ffffff"
        />
      )}
      <div className="relative z-10">
        <WelcomeAlert />
        <Navbar />
        <div className="relative w-full">
          <div className="relative w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] xl:h-[600px] overflow-hidden bg-black">
            <Image
              src="/images/banner.png"
              alt="Banner"
              fill
              className="object-contain"
              sizes="100vw"
              quality={100}
              priority
            />
          </div>
        </div>
        <HomePage />
      </div>
    </div>
  );
}
