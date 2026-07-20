import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleCardProps {
  title: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  defaultOpen = false,
  className = "",
  headerExtra,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`collapsible-card ${open ? "open" : "closed"} ${className}`}>
      <button
        type="button"
        className="collapsible-card-header"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="collapsible-card-icon">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <span className="collapsible-card-title">{title}</span>
        {headerExtra && <span className="collapsible-card-extra">{headerExtra}</span>}
      </button>
      {open && <div className="collapsible-card-body">{children}</div>}
    </div>
  );
};

export default CollapsibleCard;
