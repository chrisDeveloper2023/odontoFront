import React from "react";
import toothIcon from "@/assets/tooth-icon.svg";

interface AnimatedToothImageProps {
  className?: string;
}

const AnimatedToothImage: React.FC<AnimatedToothImageProps> = ({ className }) => {
  return (
    <div className="relative group">
      <img
        src={toothIcon}
        alt="Tooth Icon"
        className={`${className} animate-tooth-glow hover:animate-tooth-rotate transition-all duration-500 hover:scale-110 cursor-pointer`}
        style={{
          filter: "brightness(0) invert(1)", // Convierte la imagen a blanco
        }}
      />
      {/* Efecto de brillo animado al hacer hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 animate-shimmer transition-opacity duration-300"></div>
      
      {/* Efecto de pulso suave */}
      <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 animate-ping"></div>
    </div>
  );
};

export default AnimatedToothImage;
