import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

export interface ChatMessageProps {
  type: "bot" | "user";
  content: string;
  timestamp?: Date;
  emojiLabel?: string;
  subtext?: string;
  isLoading?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  type,
  content,
  timestamp,
  emojiLabel,
  subtext,
  isLoading,
}) => {
  const isBot = type === "bot";

  return (
    <div className={clsx("flex mb-4", isBot ? "justify-start" : "justify-end")}>
      <div
        className={clsx(
          "max-w-xs lg:max-w-md px-4 py-3 rounded-2xl",
          isBot
            ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
            : "bg-sky-500 text-white"
        )}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              {content}
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                •
              </motion.span>
            </span>
          ) : (
            content
          )}
        </div>
        {subtext && (
          <div className="mt-2 text-xs opacity-75">
            {subtext}
          </div>
        )}
        {emojiLabel && (
          <div className="mt-2 text-xs opacity-75 font-medium">{emojiLabel}</div>
        )}
        {timestamp && (
          <div className="mt-1 text-xs opacity-50">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
};
