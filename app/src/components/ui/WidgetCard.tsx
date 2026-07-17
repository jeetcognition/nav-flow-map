import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { fadeUp } from "../../lib/motion";

interface Props {
  title: string;
  icon?: ReactNode;
  /** optional "View all" style link */
  linkTo?: string;
  linkLabel?: string;
  index?: number;
  className?: string;
  children: ReactNode;
}

/** Standard section card: small-caps title, optional trailing link, staggered entrance. */
export function WidgetCard({ title, icon, linkTo, linkLabel = "View all", index = 0, className = "", children }: Props) {
  return (
    <motion.section className={`card widget-card ${className}`} {...fadeUp(index * 0.06)}>
      <div className="widget-card-head">
        <h2 className="widget-card-title">
          {icon}
          {title}
        </h2>
        {linkTo && (
          <Link to={linkTo} className="widget-card-link">
            {linkLabel}
          </Link>
        )}
      </div>
      {children}
    </motion.section>
  );
}
