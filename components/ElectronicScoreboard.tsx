
import React from 'react';
import { MatchSchedule } from '../types';

interface ElectronicScoreboardProps {
  schedule: MatchSchedule;
}

const ElectronicScoreboard: React.FC<ElectronicScoreboardProps> = ({ schedule }) => {
  return (
    <div className="bg-[#0f172a] p-1 rounded-[12px] border-[3px] border-slate-800 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.6)] relative overflow-hidden w-full max-w-[420px] mx-auto transition-all duration-700">
      
      <div className="relative bg-[#050b14] rounded-[8px] px-3 py-3 border border-white/5 overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.1]" style={{
          backgroundImage: 'radial-gradient(#10b981 1.5px, transparent 1.5px)',
          backgroundSize: '6px 6px'
        }}></div>
        
        {/* Scanline Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent opacity-20 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-emerald-900/50 pb-2 mb-3">
             <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_8px_#ef4444]"></div>
               <span className="text-[10px] font-[900] text-emerald-600 tracking-[0.2em] uppercase">MATCH INFO</span>
             </div>
             <div className="text-[12px] font-black text-slate-400 tracking-widest">{schedule.date}</div>
          </div>

          {/* Data Grid - Optimized gap for readability (gap-y-6) */}
          <div className="w-full grid grid-cols-[45px_10px_1fr] items-center gap-y-6">
            
            {/* Row 1: Venue */}
            <div className="text-white text-[12px] font-black tracking-tighter text-justify leading-none">장소</div>
            <div className="text-emerald-800 font-bold leading-none">:</div>
            <div className="text-white text-[14px] font-bold tracking-tight drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] leading-none">
              {schedule.venue}
            </div>

            {/* Row 2: Time */}
            <div className="text-white text-[12px] font-black tracking-tighter text-justify leading-none">시간</div>
            <div className="text-emerald-800 font-bold leading-none">:</div>
            <div className="text-white text-[14px] font-bold tracking-tight drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] leading-none">
              {schedule.time}
            </div>

            {/* Row 3: Opponents */}
            <div className="text-white text-[12px] font-black tracking-tighter text-justify leading-none">상대팀</div>
            <div className="text-emerald-800 font-bold leading-none">:</div>
            <div className="text-white text-[15px] font-[900] tracking-tight leading-none drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
              {schedule.opponents}
            </div>

          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ElectronicScoreboard;
