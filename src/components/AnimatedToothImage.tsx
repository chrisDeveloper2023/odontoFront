import React from "react";
import toothIcon from "@/assets/tooth-icon.svg";

interface AnimatedToothImageProps {
  className?: string;
}

const AnimatedToothImage: React.FC<AnimatedToothImageProps> = ({ className }) => {
  return (
    <img
      src={toothIcon}
      alt="Tooth Icon"
      className={className}
      style={{
        filter: "brightness(0) invert(1)", // Convierte la imagen a blanco
      }}
    />
  );
};

export default AnimatedToothImage;
