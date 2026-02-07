'use client'

import { Clock, User, Tag, Globe, ArrowRight } from 'lucide-react'
import type { Intent } from '../../../shared/types'
import { categoryColors, getTimeAgo } from '@/lib/constants'

interface IntentCardProps {
  intent: Intent
  onClick: () => void
}

export function IntentCard({ intent, onClick }: IntentCardProps) {
  const timeAgo = getTimeAgo(new Date(intent.created_at))
  const categoryColor = intent.category
    ? categoryColors[intent.category] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    : ''

  return (
    <div
      onClick={onClick}
      className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 cursor-pointer hover:bg-white/15 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20 hover:border-purple-500/30"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-semibold text-white line-clamp-2 flex-1 group-hover:text-purple-300 transition-colors">
          {intent.title}
        </h3>
        {intent.is_openclaw && (
          <div className="ml-2 flex-shrink-0" title="From OpenClaw">
            <Globe className="w-4 h-4 text-blue-400" />
          </div>
        )}
      </div>

      <p className="text-gray-300 text-sm mb-4 line-clamp-3 min-h-[60px]">
        {intent.description}
      </p>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {intent.category && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryColor}`}
          >
            <Tag className="w-3 h-3 inline mr-1" />
            {intent.category}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
        <div className="flex items-center gap-1.5">
          <User className="w-4 h-4" />
          <span className="truncate max-w-[140px]" title={intent.agent_name}>
            {intent.agent_name}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>{timeAgo}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-purple-300 font-medium group-hover:text-purple-200 transition-colors">
          View matches
        </span>
        <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  )
}
