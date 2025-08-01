
"use client"

import type { Player, Ball } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import { PlayerAvatar } from "./player-avatar"
import { Card } from "@/components/ui/card"
import { GOAL_WIDTH } from "@/app/room/[id]/page"

interface ArenaProps {
  players: Player[];
  ball: Ball;
  width: number;
  height: number;
  countdown: number;
  kickIndicator: { angle: number; show: boolean } | null;
}

const GOAL_DEPTH = 20;
const CENTER_CIRCLE_RADIUS = 50;


export function Arena({ players, ball, width, height, countdown, kickIndicator }: ArenaProps) {
  const userPlayer = players.find(p => p.isUser);

  return (
    <Card className="h-full w-full p-2 shadow-lg">
      <div
        className="relative bg-card rounded-md overflow-hidden w-full h-full border-2 border-primary/20"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
           backgroundImage: `
            linear-gradient(rgba(var(--primary-rgb), 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--primary-rgb), 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      >
         <style jsx>{`
          div {
            --primary-rgb: 41, 171, 226;
          }
          .dark div {
             --primary-rgb: 41, 171, 226;
          }
        `}</style>
         <AnimatePresence>
          {countdown > 0 && (
            <motion.div
              key={countdown}
              className="absolute inset-0 flex items-center justify-center z-50"
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="text-8xl font-bold text-white" style={{ WebkitTextStroke: '2px black' }}>
                {countdown}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Goals */}
        <div 
            className="absolute top-1/2 -translate-y-1/2 left-0 bg-red-500/50" 
            style={{height: `${GOAL_WIDTH}px`, width: `${GOAL_DEPTH}px`}}
        />
        <div 
            className="absolute top-1/2 -translate-y-1/2 right-0 bg-blue-500/50" 
            style={{height: `${GOAL_WIDTH}px`, width: `${GOAL_DEPTH}px`}}
        />

        {/* Center Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[1px] bg-primary/20" />
        
        {/* Center Circle */}
        <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20"
            style={{width: `${CENTER_CIRCLE_RADIUS * 2}px`, height: `${CENTER_CIRCLE_RADIUS * 2}px`}}
        />
        
        {/* Kick Indicator */}
        {userPlayer && kickIndicator && kickIndicator.show && (
           <motion.div
            className="absolute"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              left: userPlayer.position.x,
              top: userPlayer.position.y,
              transform: `rotate(${kickIndicator.angle}rad)`,
              transformOrigin: 'left center',
              zIndex: 10,
            }}
          >
            <div className="w-24 h-0.5 bg-yellow-400 rounded-full relative ml-2">
                 <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-yellow-400 transform rotate-45"></div>
            </div>
          </motion.div>
        )}

        {/* Ball */}
         <motion.div
            className="absolute w-5 h-5 bg-white rounded-full border-2 border-black shadow-lg"
            animate={{ x: ball.position.x - 10, y: ball.position.y - 10 }}
            transition={{ duration: 0, ease: "linear" }}
        />
        
        {/* Players */}
        {players.map(player => (
          <PlayerAvatar key={player.id} player={player} />
        ))}
      </div>
    </Card>
  )
}
