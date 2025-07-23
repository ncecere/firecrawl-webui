"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { JobStats } from "@/types/jobs"

interface StatsCardsProps {
  stats: JobStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Jobs",
      value: stats.total,
      className: "text-2xl font-bold",
    },
    {
      title: "Running",
      value: stats.running,
      className: "text-2xl font-bold text-blue-600",
    },
    {
      title: "Completed",
      value: stats.completed,
      className: "text-2xl font-bold text-green-600",
    },
    {
      title: "Failed",
      value: stats.failed,
      className: "text-2xl font-bold text-red-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={card.className}>{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
