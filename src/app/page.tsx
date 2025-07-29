import Image from "next/image";
import Galaxy from "@/Backgrounds/Galaxy/Galaxy";
import HeroSection from "@/components/herosection";

export default function Home() {
  return (
    <div className="relative w-full min-h-screen">
      {/* Galaxy Background */}
      <div className="absolute inset-0 z-0">
        <Galaxy 
          mouseRepulsion={false}
          mouseInteraction={true}
          density={1}
          glowIntensity={0.5}
          saturation={0}
          hueShift={2}
        />
      </div>
      
      {/* Hero Section with Earth Model */}
      <div className="relative z-10">
        <HeroSection />
      </div>
    </div>
  );
}
