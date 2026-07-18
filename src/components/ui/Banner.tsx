import React from "react";
import { CheckCircle, Info, X } from "lucide-react";

interface BannerProps {
  type: "success" | "error";
  message: string;
  onClose?: () => void;
}

const Banner: React.FC<BannerProps> = ({ type, message, onClose }) => {
  const Icon = type === "success" ? CheckCircle : Info;

  return (
    <div className={type === "success" ? "success-banner" : "error-banner"}>
      <Icon size={18} />
      {message}
      {onClose && (
        <button type="button" className="success-close" onClick={onClose}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Banner;
