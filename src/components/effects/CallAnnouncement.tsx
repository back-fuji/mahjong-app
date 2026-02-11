import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CallAnnouncementProps {
  text: string; // 'ポン' | 'チー' | 'カン'
}

/**
 * 鳴き演出: 画面中央にテキストをフェードイン→フェードアウト表示
 */
export const CallAnnouncement: React.FC<CallAnnouncementProps> = ({ text }) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            fontFamily: '"Yu Mincho", "游明朝", "Hiragino Mincho Pro", "ヒラギノ明朝 Pro", "MS PMincho", serif',
            fontSize: '4rem',
            fontWeight: 900,
            color: '#f97316',
            textShadow: '0 0 30px rgba(249, 115, 22, 0.6), 0 0 60px rgba(249, 115, 22, 0.3), 0 4px 8px rgba(0,0,0,0.5)',
            letterSpacing: '0.15em',
          }}
        >
          {text}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
