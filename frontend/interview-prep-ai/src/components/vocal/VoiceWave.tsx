import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { VoiceStudioState } from "../../hooks/useVoiceStudio";

interface VoiceWaveProps {
  state: VoiceStudioState;
  getFrequencyData: () => Uint8Array;
}

const BAR_COUNT = 32;

const VoiceWave: React.FC<VoiceWaveProps> = ({ state, getFrequencyData }) => {
  const [bars, setBars] = useState<number[]>(new Array(BAR_COUNT).fill(10));
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      if (state === "LISTENING") {
        const data = getFrequencyData();
        const newBars: number[] = [];
        const step = Math.floor(data.length / BAR_COUNT);

        for (let i = 0; i < BAR_COUNT; i++) {
          const value = data[i * step] || 0;
          // Normalize to a pleasant height range (e.g., 8px to 100px)
          const normalizedHeight = Math.max(8, (value / 255) * 100);
          newBars.push(normalizedHeight);
        }
        setBars(newBars);
      } else if (state === "IDLE") {
        // Subtle breathing animation when IDLE
        const time = Date.now() / 1000;
        const newBars = bars.map((_, i) => 8 + Math.sin(time + i * 0.3) * 5);
        setBars(newBars);
      } else if (state === "THINKING") {
        // Scanning/Thinking animation
        const time = Date.now() / 150;
        const newBars = bars.map((_, i) => 15 + Math.sin(time + i * 0.8) * 15);
        setBars(newBars);
      }
      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [state, getFrequencyData, bars]);

  return (
    <div className="flex items-center justify-center gap-1.5 h-32 w-full">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className={`w-1.5 rounded-full transition-colors duration-700 ${
            state === "LISTENING"
              ? "bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
              : state === "THINKING"
                ? "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                : "bg-gray-200 dark:bg-gray-700"
          }`}
          animate={{
            height: `${height}px`,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
        />
      ))}
    </div>
  );
};

export default VoiceWave;
