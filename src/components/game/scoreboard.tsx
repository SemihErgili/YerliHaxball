
"use client"

import { Crown, Users, UserX, ArrowLeftRight } from "lucide-react"

import type { Player } from "@/lib/types"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ScoreboardProps {
  players: Player[],
  onKickPlayer: (playerId: string) => void,
  onChangeTeam?: (playerId: string, newTeam: 'red' | 'blue') => void,
  isAdmin?: boolean
}

export function Scoreboard({ players, onKickPlayer, onChangeTeam, isAdmin }: ScoreboardProps) {
  const redTeam = players.filter(p => p.team === 'red');
  const blueTeam = players.filter(p => p.team === 'blue');

  const renderTeam = (team: Player[], teamName: string, color: string) => (
    <div>
        <h3 className={`text-lg font-bold p-2 ${teamName === 'Kırmızı Takım' ? 'text-red-500' : 'text-blue-500'}`}>{teamName}</h3>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Oyuncu</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {team.map((player) => (
                <TableRow key={player.id} className={player.isUser ? "bg-primary/10" : ""}>
                    <TableCell>
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                        <AvatarFallback style={{ backgroundColor: color, color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {player.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{player.name} {player.isUser && "(Siz)"}</span>
                    </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                            {isAdmin && onChangeTeam && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8" 
                                                onClick={() => onChangeTeam(player.id, player.team === 'red' ? 'blue' : 'red')}
                                            >
                                                <ArrowLeftRight className="h-4 w-4 text-blue-500"/>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Takım Değiştir</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            {!player.isUser && (
                               <TooltipProvider>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onKickPlayer(player.id)}>
                                            <UserX className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Botu At</p>
                                    </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  )

  return (
    <Card className="h-full w-full flex flex-col shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center"><Users className="mr-2 text-primary"/>Oyuncular</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-auto">
        {renderTeam(redTeam, "Kırmızı Takım", "#F47920")}
        {renderTeam(blueTeam, "Mavi Takım", "#29ABE2")}
      </CardContent>
    </Card>
  )
}
