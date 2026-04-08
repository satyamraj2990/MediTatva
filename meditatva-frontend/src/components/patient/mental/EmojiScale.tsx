import React from "react";
import { motion } from "framer-motion";
import { EMOJI_SCALE_OPTIONS } from "@/lib/screeningConfig";

interface EmojiScaleProps {
  onSelect: (score: 0 | 1 | 2 | 3) => void;
  disabled?: boolean;
}

export const EmojiScale: React.FC<EmojiScaleProps> = ({ onSelect, disabled = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex gap-3 justify-center flex-wrap mt-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {EMOJI_SCALE_OPTIONS.map((option) => (
        <motion.button
          key={option.score}
          onClick={() => onSelect(option.score as 0 | 1 | 2 | 3)}
          whileHover={{ scale: disabled ? 1 : 1.15 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          disabled={disabled}
          className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:cursor-not-allowed"
        >
          <div className="text-3xl">{option.emoji}</div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 text-center">
            {option.label}
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
};
