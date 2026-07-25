import React from 'react';
import './_group.css';

export function HouseInterior() {
  return (
    <div className="min-h-[100dvh] bg-neutral-950 flex flex-col items-center justify-center p-8 overflow-hidden font-sans text-neutral-200">
      <div className="absolute top-8 left-8 z-50">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Agent House Interior</h1>
        <p className="text-neutral-400">Live Activities View</p>
      </div>

      <div className="relative w-full max-w-[1000px] h-[800px] flex items-center justify-center perspective-[1200px] z-10">
        {/* Container for Isometric Transform */}
        <div className="w-[800px] h-[600px] relative iso-view shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] transition-transform duration-1000 ease-out hover:rotateX-[40deg] hover:rotateZ-[30deg]">
          
          {/* Ground / Outside Area */}
          <div className="absolute -inset-16 bg-[#0a0a0a] rounded-3xl border border-neutral-800 flex flex-col justify-end overflow-hidden -z-10 shadow-[0_0_100px_rgba(0,0,0,0.8)_inset]">
            {/* Grass/Yard Area */}
            <div className="absolute top-0 left-0 w-full h-2/3 bg-neutral-900/30" />
            
            {/* Sidewalk */}
            <div className="h-16 bg-neutral-800/80 border-t border-neutral-700 flex items-center px-12 gap-8 relative z-10">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-20" />
              <span className="text-2xl drop-shadow-lg transform -rotate-12">🌳</span>
              <span className="text-2xl drop-shadow-lg transform -rotate-12 ml-12">🌳</span>
              <div className="h-full w-4 bg-neutral-700/50 skew-x-12 mx-12 shadow-inner" />
              <span className="text-2xl drop-shadow-lg transform -rotate-12">🌳</span>
            </div>
            
            {/* Street */}
            <div className="h-24 bg-neutral-950 border-t border-neutral-800 relative overflow-hidden">
              <div className="absolute top-1/2 left-0 w-full border-t-4 border-dashed border-yellow-500/20" />
              
              {/* Taxi */}
              <div className="absolute top-1/2 left-[70%] -translate-y-1/2 w-28 h-12 bg-yellow-500 rounded-lg shadow-2xl flex items-center justify-center transform -rotate-0 z-20">
                <div className="absolute top-0.5 w-12 h-10 bg-black/40 rounded-sm border border-yellow-600" />
                <div className="w-5 h-1.5 bg-red-500 absolute right-1 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
                <div className="w-5 h-1.5 bg-yellow-200 absolute left-1 rounded-full shadow-[0_0_15px_rgba(253,224,71,1)]" />
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-2 bg-yellow-400 rounded-t-sm" />
              </div>
            </div>
          </div>

          {/* House Main Floor Plan */}
          <div className="absolute inset-0 bg-neutral-900 wall-thickness border-8 border-neutral-800 grid grid-cols-12 grid-rows-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] z-10">
            
            {/* Bedroom (top-left, 5x6) */}
            <div className="col-span-5 row-span-6 border-r-8 border-b-8 border-neutral-800 relative bg-amber-950/20 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.08)_0%,transparent_70%)] animate-glow" />
              <div className="absolute top-3 left-3 text-[10px] font-bold tracking-widest text-neutral-500 uppercase">Bedroom</div>
              
              {/* Rug */}
              <div className="absolute top-20 left-12 w-40 h-32 bg-indigo-950/30 rounded-sm border border-indigo-900/20" />

              {/* Bed */}
              <div className="absolute top-12 left-8 w-28 h-36 bg-indigo-900/90 rounded-md border-2 border-indigo-800/80 flex flex-col items-center shadow-lg">
                {/* Pillows */}
                <div className="flex gap-2 mt-2 w-full px-3">
                  <div className="flex-1 h-8 bg-neutral-200/90 rounded-sm shadow-inner" />
                  <div className="flex-1 h-8 bg-neutral-200/90 rounded-sm shadow-inner" />
                </div>
                {/* Blanket */}
                <div className="absolute bottom-0 w-full h-3/4 bg-indigo-800/60 rounded-b-md border-t border-indigo-500/30 shadow-[0_-5px_10px_rgba(0,0,0,0.2)]" />
                
                {/* Agent Sleeping */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-8 h-16 bg-pink-500 rounded-full shadow-[0_0_20px_rgba(236,72,153,0.6)] z-10 flex flex-col items-center pt-1">
                  <div className="w-6 h-6 bg-pink-300 rounded-full border-2 border-pink-500" />
                  <div className="w-5 h-8 bg-pink-400 mt-1 rounded-full opacity-80" />
                  {/* ZZZs */}
                  <div className="absolute -top-4 -right-6 text-pink-300 font-bold text-sm animate-zzz">Z</div>
                  <div className="absolute -top-8 -right-2 text-pink-300 font-bold text-xs animate-zzz-delay-1">z</div>
                  <div className="absolute -top-12 -right-8 text-pink-300 font-bold text-[10px] animate-zzz-delay-2">z</div>
                </div>
              </div>

              {/* Nightstands & Lamps */}
              <div className="absolute top-12 left-[150px] w-10 h-10 bg-amber-900/60 rounded-sm border border-amber-800/60 flex items-center justify-center shadow-md">
                <div className="w-5 h-5 rounded-full bg-yellow-200 shadow-[0_0_25px_rgba(253,224,71,0.8)]" />
              </div>
              
              {/* Wardrobe */}
              <div className="absolute bottom-4 left-4 w-12 h-32 bg-neutral-800 rounded-sm border border-neutral-700 shadow-lg flex justify-center py-2">
                <div className="w-0.5 h-full bg-neutral-900/50" />
              </div>
            </div>

            {/* Bathroom (top-right, 7x5) */}
            <div className="col-span-7 row-span-5 border-b-8 border-neutral-800 relative bg-cyan-950/20 overflow-hidden">
              {/* Tile pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(8,145,178,0.08)_25%,transparent_25%,transparent_50%,rgba(8,145,178,0.08)_50%,rgba(8,145,178,0.08)_75%,transparent_75%,transparent_100%)] bg-[length:24px_24px]" />
              <div className="absolute top-3 left-3 text-[10px] font-bold tracking-widest text-neutral-500 uppercase">Bathroom</div>
              
              {/* Shower */}
              <div className="absolute top-4 right-4 w-28 h-28 bg-cyan-900/40 border-l-2 border-b-2 border-cyan-700/60 rounded-bl-lg flex items-center justify-center backdrop-blur-sm shadow-inner">
                {/* Drain */}
                <div className="absolute bottom-3 right-3 w-4 h-4 rounded-full border-2 border-neutral-600/50" />
                {/* Shower head */}
                <div className="absolute top-0 right-1/2 w-6 h-6 rounded-full border-4 border-neutral-500 border-t-cyan-400/80 shadow-[0_10px_20px_rgba(34,211,238,0.2)]" />
                
                <div className="absolute w-5 h-5 bg-white/30 rounded-full blur-md animate-steam" />
                <div className="absolute w-8 h-8 bg-white/20 rounded-full blur-xl animate-steam-delay" />
              </div>

              {/* Sink Counter */}
              <div className="absolute bottom-4 left-12 w-32 h-14 bg-neutral-800 rounded-full border border-neutral-700 flex justify-center items-center shadow-lg">
                {/* Basin */}
                <div className="w-16 h-8 bg-cyan-950/60 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)_inset]" />
              </div>

              {/* Toilet */}
              <div className="absolute top-6 left-6 w-12 h-16 flex flex-col shadow-md">
                <div className="w-full h-6 bg-neutral-200/90 rounded-sm border border-neutral-400" />
                <div className="w-10 h-10 mx-auto bg-neutral-100/90 rounded-b-3xl border border-neutral-400" />
              </div>
            </div>

            {/* Living Room (bottom-left, 7x6) */}
            <div className="col-span-7 row-span-7 border-r-8 border-neutral-800 relative bg-emerald-950/10 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(16,185,129,0.08)_0%,transparent_60%)] animate-glow" />
              <div className="absolute top-3 left-3 text-[10px] font-bold tracking-widest text-neutral-500 uppercase z-10">Living Room</div>
              
              {/* Rug */}
              <div className="absolute bottom-8 left-16 w-56 h-48 border-[6px] border-dashed border-emerald-900/30 rounded-2xl -z-10" />

              {/* TV & Console */}
              <div className="absolute bottom-12 left-8 w-14 h-48 bg-neutral-800 rounded-sm border border-neutral-700 flex items-center justify-center shadow-lg">
                {/* Screen */}
                <div className="w-6 h-40 bg-blue-500/90 rounded-sm shadow-[0_0_40px_rgba(59,130,246,0.8)] animate-tv-flicker border border-blue-400" />
              </div>

              {/* Coffee Table */}
              <div className="absolute bottom-24 left-36 w-24 h-24 bg-amber-900/70 rounded-full border border-amber-800/60 shadow-lg flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border border-amber-800/40" />
              </div>

              {/* Sofa (L-shaped) */}
              <div className="absolute bottom-16 left-64 w-32 h-40 flex flex-col justify-between shadow-xl">
                {/* Main section */}
                <div className="absolute top-0 right-0 w-32 h-16 bg-emerald-900/90 rounded-xl border border-emerald-700/60 flex flex-col justify-between p-2">
                  <div className="w-full h-1/2 bg-emerald-800/90 rounded-md mb-1 shadow-inner" />
                  <div className="w-full h-1/2 bg-emerald-800/90 rounded-md shadow-inner" />
                </div>
                {/* Chaise */}
                <div className="absolute bottom-0 right-0 w-16 h-24 bg-emerald-900/90 rounded-b-xl border border-emerald-700/60 p-2">
                  <div className="w-full h-full bg-emerald-800/90 rounded-md shadow-inner" />
                </div>
              </div>

              {/* Agent Watching TV */}
              <div className="absolute bottom-32 left-[270px] w-12 h-12 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.6)] flex items-center justify-center z-10 transform -rotate-[100deg]">
                <div className="w-7 h-7 bg-emerald-300 rounded-full border-2 border-emerald-500 flex justify-end items-center pr-1">
                  <div className="flex flex-col gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-900 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-emerald-900 rounded-full" />
                  </div>
                </div>
                <div className="absolute -left-2 w-4 h-6 bg-emerald-600 rounded-full" />
                <div className="absolute -right-2 w-4 h-6 bg-emerald-600 rounded-full" />
              </div>
              
              {/* Plant */}
              <div className="absolute top-6 right-6 w-12 h-12 bg-green-900/40 rounded-full border border-green-800/50 flex items-center justify-center">
                <div className="text-2xl opacity-60">🪴</div>
              </div>
            </div>
            
            {/* Kitchen (bottom-right, 5x7) */}
            <div className="col-span-5 row-span-7 relative bg-orange-950/10 overflow-hidden">
              {/* Tile pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:32px_32px]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(249,115,22,0.1)_0%,transparent_70%)] animate-glow" />
              <div className="absolute top-3 left-3 text-[10px] font-bold tracking-widest text-neutral-500 uppercase z-10">Kitchen</div>
              
              {/* Island / Dining */}
              <div className="absolute top-16 left-8 w-24 h-48 bg-neutral-800 rounded-md border border-neutral-700 flex flex-col justify-around p-3 shadow-xl z-10">
                <div className="w-full h-full bg-neutral-700/40 rounded-sm border border-neutral-600/30 flex flex-col items-center justify-around py-4">
                   {/* Bar stools */}
                   <div className="absolute -left-4 w-6 h-6 bg-amber-900/80 rounded-full border border-amber-700/50 shadow-md" />
                   <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-amber-900/80 rounded-full border border-amber-700/50 shadow-md" />
                   <div className="absolute -left-4 bottom-8 w-6 h-6 bg-amber-900/80 rounded-full border border-amber-700/50 shadow-md" />
                </div>
              </div>

              {/* Counters against right wall */}
              <div className="absolute top-4 right-4 w-20 h-56 bg-neutral-800 border border-neutral-700 rounded-md flex flex-col items-center py-4 gap-6 shadow-xl">
                {/* Fridge */}
                <div className="w-16 h-16 bg-neutral-300 rounded-sm border-2 border-neutral-400 shadow-inner flex flex-col">
                  <div className="flex-1 border-b border-neutral-400" />
                  <div className="flex-[2]" />
                </div>
                
                {/* Sink */}
                <div className="w-16 h-12 bg-neutral-700 rounded-sm flex items-center justify-center shadow-inner">
                  <div className="w-10 h-8 bg-neutral-900 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.8)_inset]" />
                  <div className="absolute right-4 w-2 h-4 bg-neutral-400 rounded-full" />
                </div>
                
                {/* Stove */}
                <div className="w-16 h-16 bg-orange-950/50 rounded-sm border-2 border-orange-800/60 grid grid-cols-2 grid-rows-2 p-1.5 gap-1.5 relative shadow-inner">
                  <div className="bg-orange-500/90 rounded-full shadow-[0_0_12px_rgba(249,115,22,0.8)]" />
                  <div className="bg-red-500/90 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
                  <div className="bg-neutral-800 rounded-full" />
                  <div className="bg-orange-500/90 rounded-full shadow-[0_0_12px_rgba(249,115,22,0.8)]" />
                  
                  {/* Steam */}
                  <div className="absolute -top-8 -left-6 text-white/50 text-2xl animate-steam">☁️</div>
                </div>
              </div>

              {/* Agent Cooking */}
              <div className="absolute top-40 right-28 w-12 h-12 bg-orange-500 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.6)] flex items-center justify-center z-20">
                <div className="w-7 h-7 bg-orange-300 rounded-full border-2 border-orange-500 flex justify-end items-center pr-1">
                  <div className="w-1.5 h-1.5 bg-orange-900 rounded-full" />
                </div>
                <div className="absolute -top-2 w-4 h-4 bg-orange-600 rounded-full" />
                <div className="absolute -bottom-2 w-4 h-4 bg-orange-600 rounded-full" />
              </div>
            </div>

            {/* Hallway / Entrance overlay - to make the layout feel connected */}
            <div className="absolute bottom-0 left-[58%] w-24 h-12 bg-neutral-800 flex flex-col items-center justify-end border-t border-l border-r border-neutral-700/50 z-20 shadow-lg">
              {/* Doormat */}
              <div className="w-16 h-6 mb-1 bg-amber-900/60 border border-amber-800/50 text-[6px] text-center text-amber-500/70 font-mono flex items-center justify-center rounded-sm">WELCOME</div>
            </div>
            
            {/* Front Door (open slightly) */}
            <div className="absolute -bottom-2 left-[58%] w-20 h-2 bg-amber-700 rounded-sm z-30 transform origin-left -rotate-12 shadow-lg" />

            {/* Wall separators - overlaying to fix grid gaps */}
            <div className="absolute top-1/2 left-0 w-[58%] h-2 bg-neutral-800 -translate-y-1/2 shadow-md z-30" />
            <div className="absolute top-0 left-[41.6%] w-2 h-full bg-neutral-800 shadow-md z-30" />
            
            {/* Interior Doors */}
            <div className="absolute top-1/2 left-[20%] w-12 h-2 bg-amber-800 -translate-y-1/2 z-40 transform origin-left -rotate-45" /> {/* Bedroom to Living */}
            <div className="absolute top-[30%] left-[41.6%] w-2 h-12 bg-amber-800 z-40 transform origin-top rotate-45" /> {/* Bath to Hall */}
            
          </div>
        </div>
      </div>
      
      {/* Legend / Status HUD */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-4 max-w-sm bg-neutral-950/90 backdrop-blur-xl p-6 rounded-2xl border border-neutral-800 shadow-2xl z-50">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Active Agents</h3>
          <div className="flex gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             <div className="text-[10px] text-green-500 uppercase tracking-wider font-bold">Live</div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 bg-neutral-900/50 p-2 rounded-lg border border-neutral-800/50">
            <div className="w-8 h-8 rounded-full bg-pink-950 border border-pink-800 flex items-center justify-center">
              <div className="w-3 h-3 bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)]" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">Agent Alpha</div>
              <div className="text-xs text-pink-400">Sleeping in Bedroom</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-neutral-900/50 p-2 rounded-lg border border-neutral-800/50">
             <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">Agent Beta</div>
              <div className="text-xs text-emerald-400">Watching TV in Living Room</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-neutral-900/50 p-2 rounded-lg border border-neutral-800/50">
             <div className="w-8 h-8 rounded-full bg-orange-950 border border-orange-800 flex items-center justify-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">Agent Gamma</div>
              <div className="text-xs text-orange-400">Cooking in Kitchen</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}