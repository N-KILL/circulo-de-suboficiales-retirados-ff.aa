import React from "react";
import { CheckCircle, Info, X } from "lucide-react";

interface BannerProps {
  type: "success" | "error";
  message: string;
  onClose?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

const Banner: React.FC<BannerProps> = ({ type, message, onClose, actionLabel, onAction }) => {
  const Icon = type === "success" ? CheckCircle : Info;

  return (
    <div className={type === "success" ? "success-banner" : "error-banner"}>
      <Icon size={18} />
      {message}
      {actionLabel && onAction && (
        <button type="button" className="banner-action-btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      {onClose && (
        <button type="button" className="success-close" onClick={onClose}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Banner;
