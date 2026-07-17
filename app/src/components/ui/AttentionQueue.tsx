import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Fire,
  Play,
  ShieldWarning,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import { buildAttentionItems } from "../../lib/attention";

const ICONS = { run: Play, fire: Fire, shield: ShieldWarning, ai: Sparkle, warn: WarningCircle };

export function AttentionQueue() {
  const items = buildAttentionItems();

  if (items.length === 0) {
    return (
      <div className="card attention-clear">
        <CheckCircle size={20} weight="duotone" color="var(--accent)" />
        All clear — nothing needs your attention right now.
      </div>
    );
  }

  return (
    <section className="attention" aria-label="Needs your attention">
      <h2 className="attention-title">Needs your attention</h2>
      <div className="attention-list">
        {items.map((item, i) => {
          const Icon = ICONS[item.icon];
          return (
            <motion.div
              key={item.id}
              className={`attention-item tone-${item.tone}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <Icon size={18} weight="duotone" />
              <span className="attention-text">{item.text}</span>
              <Link to={item.to} className="btn attention-cta">
                {item.cta}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
