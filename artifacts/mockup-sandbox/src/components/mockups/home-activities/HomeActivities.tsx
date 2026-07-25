import React from 'react';
import './_group.css';

type EnergyImpact = 'restoring' | 'draining' | 'neutral';

interface Activity {
  id: string;
  emoji: string;
  titleUz: string;
  titleEn: string;
  duration: string;
  energyImpact: EnergyImpact;
  animationClass: string;
}

const homeActivities: Activity[] = [
  { id: '1', emoji: '🛁', titleUz: 'Banyoda', titleEn: 'In Bathroom', duration: '10-20 daqiqa', energyImpact: 'restoring', animationClass: 'anim-bathroom' },
  { id: '2', emoji: '😴', titleUz: 'Uxlayapti', titleEn: 'Sleeping', duration: '6-8 soat', energyImpact: 'restoring', animationClass: 'anim-sleeping' },
  { id: '3', emoji: '📱', titleUz: "Telefon ko'ryapti", titleEn: 'Phone Scrolling', duration: '15-45 daqiqa', energyImpact: 'draining', animationClass: 'anim-phone' },
  { id: '4', emoji: '👕', titleUz: 'Kiyim almashtiryapti', titleEn: 'Getting Dressed', duration: '5-10 daqiqa', energyImpact: 'neutral', animationClass: 'anim-dressing' },
  { id: '5', emoji: '🍳', titleUz: 'Oshpaz', titleEn: 'Cooking', duration: '30-45 daqiqa', energyImpact: 'draining', animationClass: 'anim-cooking' },
  { id: '6', emoji: '📺', titleUz: "TV ko'ryapti", titleEn: 'Watching TV', duration: '1-2 soat', energyImpact: 'restoring', animationClass: 'anim-tv' },
  { id: '7', emoji: '🧘', titleUz: 'Yiliqayapti', titleEn: 'Relaxing', duration: '15-30 daqiqa', energyImpact: 'restoring', animationClass: 'anim-relaxing' },
  { id: '8', emoji: '🚪', titleUz: 'Uyga kirdi', titleEn: 'Just Arrived Home', duration: '1-2 daqiqa', energyImpact: 'neutral', animationClass: 'anim-arrived' },
];

const transitActivities: Activity[] = [
  { id: '9', emoji: '🚕', titleUz: 'Taksi kutmoqda', titleEn: 'Waiting for Taxi', duration: '5-15 daqiqa', energyImpact: 'draining', animationClass: 'anim-taxi' },
  { id: '10', emoji: '🏃', titleUz: 'Ishga ketmoqda', titleEn: 'Commuting to Work', duration: '20-60 daqiqa', energyImpact: 'draining', animationClass: 'anim-commuting' },
];

const impactBorderColors: Record<EnergyImpact, string> = {
  restoring: 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]',
  draining: 'border-rose-500/40 hover:border-rose-400 hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]',
  neutral: 'border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]',
};

const impactTextColors: Record<EnergyImpact, string> = {
  restoring: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  draining: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  neutral: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

export function HomeActivities() {
  const renderActivityCard = (activity: Activity) => (
    <div key={activity.id} className={`group relative flex flex-col bg-[#111116]/80 backdrop-blur-md border rounded-2xl overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 ${impactBorderColors[activity.energyImpact]}`}>
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="absolute top-4 right-4 text-4xl opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500 pointer-events-none grayscale group-hover:grayscale-0 filter">
        {activity.emoji}
      </div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-gray-100 tracking-wide">{activity.titleUz}</h3>
          <p className="text-[11px] text-gray-500 font-mono mt-1 uppercase tracking-widest">{activity.titleEn}</p>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center py-10 relative z-10">
        {/* Stage circle */}
        <div className="absolute w-32 h-32 rounded-full bg-gray-800/30 border border-gray-700/50 shadow-inner group-hover:bg-gray-800/50 transition-colors" />
        
        <div className={`scene-container ${activity.animationClass}`}>
          <div className="agent-container">
            <div className="agent-head"></div>
            <div className="agent-body"></div>
          </div>
          <div className="scene-props"></div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-800/50 relative z-10">
        <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border ${impactTextColors[activity.energyImpact]}`}>
          {activity.energyImpact}
        </span>
        <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-gray-300 transition-colors">
          <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span className="text-xs font-mono">{activity.duration}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#07070a] text-gray-200 p-6 md:p-12 font-sans overflow-y-auto selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto space-y-16">
        <header className="flex flex-col gap-4 relative">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-10 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/80 border border-gray-800 w-fit mb-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest font-bold">System Status: Active</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 tracking-tight leading-tight">
            Agent Home Activity States
          </h1>
          <p className="text-gray-400 font-mono text-sm md:text-base uppercase tracking-widest flex items-center gap-4">
            <span>AI Life Simulation Reference</span>
            <span className="h-px flex-1 bg-gradient-to-r from-gray-800 to-transparent max-w-xs" />
          </p>
        </header>

        <section className="space-y-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gray-900 rounded-xl border border-gray-800 shadow-inner">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-100 tracking-wide">Home Activities</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-gray-800 to-transparent"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {homeActivities.map(renderActivityCard)}
          </div>
        </section>

        <section className="space-y-8 pb-20 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gray-900 rounded-xl border border-gray-800 shadow-inner">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-100 tracking-wide">Transit States</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-gray-800 to-transparent"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {transitActivities.map(renderActivityCard)}
          </div>
        </section>
      </div>
    </div>
  );
}
