
"use client"

import type { Player } from "@/lib/types"
import { motion } from "framer-motion"

interface PlayerAvatarProps {
  player: Player
}

const PLAYER_SIZE = 30;

export function PlayerAvatar({ player }: PlayerAvatarProps) {
  const color = player.team === 'red' ? '#F47920' : '#29ABE2';
  const borderColor = player.team === 'red' ? '#c2410c' : '#0284c7';
  
  return (
    <motion.div
      key={player.id}
      className="absolute flex flex-col items-center"
      animate={{ 
        x: player.position.x - PLAYER_SIZE/2, 
        y: player.position.y - PLAYER_SIZE/2,
        scale: player.kicking ? [1, 1.3, 1] : 1,
      }}
      transition={{ 
        duration: 0.1,
        ease: "linear",
        scale: { duration: 0.15 } 
      }}
    >
      <div 
        className="rounded-full border-2 flex items-center justify-center shadow-lg"
        style={{
          width: `${PLAYER_SIZE}px`,
          height: `${PLAYER_SIZE}px`,
          backgroundColor: color,
          borderColor: borderColor,
          boxShadow: player.isUser ? `0 0 10px ${color}` : 'none'
        }}
      >
        <span className="font-bold text-white text-[10px] select-none">
            {player.name.substring(0, 3)}
        </span>
      </div>
    </motion.div>
  )
}
