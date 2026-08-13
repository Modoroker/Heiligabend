import React from 'react';
import { Trophy, Flame } from 'lucide-react';

export default function MilestoneCard({ openedCount = 0, streak = 0, startDateStr = '2026-12-24', currentDate }) {
  // Compute days since first started
  const start = new Date(`${startDateStr}T00:00:00`);
  const now = currentDate ? new Date(currentDate) : new Date();
  const isStarted = now >= start;
  const diffTime = isStarted ? now.getTime() - start.getTime() : 0;
  const daysSinceStart = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Next milestone target
  const milestones = [10, 25, 50, 100, 200, 300, 365];
  const safeOpened = Number(openedCount) || 0;
  const nextMilestone = milestones.find((m) => safeOpened < m) || 365;
  const progressPercent = Math.min(100, Math.max(0, Math.round((safeOpened / nextMilestone) * 100)));

  return (
    <div className="w-full glass-card rounded-2xl p-4 border border-rosegold-500/20 shadow-rose-glow flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rosegold-500/20 border border-rosegold-500/30 text-rosegold-300">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 font-serif">
              Dein Liebes-Meilenstein
            </h4>
            <span className="text-[11px] text-slate-400">
              {isStarted ? (
                <>Vor <strong className="text-rosegold-200">{daysSinceStart} Tagen</strong> begonnen ❤️</>
              ) : (
                <>Startet an <strong className="text-rosegold-200">Heiligabend 2026</strong> 🎄</>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-midnight-800 border border-amber-500/30 text-[11px] font-semibold text-amber-300">
          <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{streak} Tage Streak</span>
        </div>
      </div>

      {/* Progress Bar towards next milestone */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{safeOpened} Gründe gelesen</span>
          <span className="font-semibold text-champagne-300">Nächstes Ziel: {nextMilestone} 🏆</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Fortschritt zum nächsten Meilenstein ${nextMilestone}`}
          className="w-full h-2 bg-midnight-900 rounded-full overflow-hidden border border-rosegold-500/20"
        >
          <div
            className="h-full bg-gradient-to-r from-rosegold-500 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
