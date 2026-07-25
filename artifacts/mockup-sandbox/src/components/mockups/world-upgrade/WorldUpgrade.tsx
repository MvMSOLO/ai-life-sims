import React, { useMemo } from 'react';
import { Sparkles, Car as CarIcon, Building2, Home, User, Eye } from 'lucide-react';
import './_group.css';

// Reusable CSS 3D Cube primitive
const Cube = ({ x, y, w, d, h, className, topClass, frontClass, rightClass, backClass, leftClass, style = {}, topStyle = {} }: any) => (
  <div className={`absolute ${className || ''}`} style={{ width: w, height: d, left: x, top: y, transformStyle: 'preserve-3d', ...style }}>
    {/* Top */}
    <div className={`absolute top-0 left-0 ${topClass || ''}`} style={{ width: w, height: d, transform: `translateZ(${h}px)`, ...topStyle }} />
    
    {/* Front (at Y = d) */}
    <div className={`absolute ${frontClass || ''}`} 
         style={{ width: w, height: h, left: 0, top: d - h / 2, transform: `translateZ(${h / 2}px) rotateX(-90deg)` }} />
         
    {/* Back (at Y = 0) */}
    <div className={`absolute ${backClass || ''}`} 
         style={{ width: w, height: h, left: 0, top: -h / 2, transform: `translateZ(${h / 2}px) rotateX(90deg)` }} />
         
    {/* Right (at X = w) */}
    <div className={`absolute ${rightClass || ''}`} 
         style={{ width: h, height: d, left: w - h / 2, top: 0, transform: `translateZ(${h / 2}px) rotateY(90deg)` }} />
         
    {/* Left (at X = 0) */}
    <div className={`absolute ${leftClass || ''}`} 
         style={{ width: h, height: d, left: -h / 2, top: 0, transform: `translateZ(${h / 2}px) rotateY(-90deg)` }} />
  </div>
);

const Agent = ({ x, y, color, name, delay }: any) => (
  <div className="absolute agent-bob" 
       style={{ left: x, top: y, animationDelay: delay, transformStyle: 'preserve-3d' }}>
    {/* Shadow / Ground Glow */}
    <div className="absolute w-12 h-12 rounded-full blur-md"
         style={{ left: -24, top: -24, backgroundColor: color, opacity: 0.4, transform: 'translateZ(1px)' }} />
    
    {/* Body (Billboarded Sphere) */}
    <div className="absolute billboard"
         style={{ left: -16, top: -16, width: 32, height: 32, '--z': '20px' } as any}>
      <div className="w-full h-full flex items-center justify-center">
        <div className="rounded-full"
             style={{ 
               width: 16, height: 16, 
               backgroundColor: color, 
               boxShadow: `0 0 15px ${color}, inset 0 0 5px rgba(255,255,255,0.8)`
             }} />
      </div>
    </div>
         
    {/* Name Tag (Billboarded) */}
    <div className="absolute billboard"
         style={{ left: -50, top: -20, width: 100, height: 40, '--z': '45px' } as any}>
      <div className="w-full h-full flex items-center justify-center pointer-events-none">
        <div className="px-2 py-0.5 bg-black/80 text-white text-[10px] font-bold rounded border border-white/20 whitespace-nowrap backdrop-blur-sm">
          {name}
        </div>
      </div>
    </div>
  </div>
);

const Car = ({ isUp, left, right, color, delay }: any) => (
  <div className="absolute top-1/2 w-[24px] h-[48px]"
       style={{ 
         left, right, 
         animation: `${isUp ? 'driveUp' : 'driveDown'} ${isUp ? 4 : 5}s infinite linear ${delay}`, 
         transformStyle: 'preserve-3d' 
       }}>
    <Cube 
      x={0} y={0} w={24} d={48} h={14} 
      topClass="border border-white/50"
      frontClass="bg-gray-800" rightClass="bg-gray-800" backClass="bg-gray-800" leftClass="bg-gray-800"
      style={{ color }}
      topStyle={{ backgroundColor: color, boxShadow: `0 0 20px ${color}` }}
    />
    {/* Headlights */}
    {isUp ? (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-[40px] h-[80px] blur-md pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(to top, ${color} 0%, transparent 100%)`, transform: 'translateZ(6px)' }} />
    ) : (
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-[40px] h-[80px] blur-md pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(to bottom, ${color} 0%, transparent 100%)`, transform: 'translateZ(6px)' }} />
    )}
  </div>
);

export function WorldUpgrade() {
  const stars = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 3
    }));
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-950 overflow-hidden font-mono text-cyan-50 flex flex-col">
      {/* Background Gradient & Stars */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-gray-950 to-gray-950" />
      {stars.map(star => (
        <div 
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: star.x, top: star.y, width: star.size, height: star.size,
            animation: `twinkle 3s infinite ease-in-out ${star.delay}s`,
            boxShadow: '0 0 8px 1px rgba(255,255,255,0.3)'
          }}
        />
      ))}

      {/* Atmospheric glow overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-900/10 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-6 md:p-8 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 neon-text" style={{ color: '#0ff' }}>
            AI LIFE 3D
          </h1>
          <p className="text-cyan-400/70 text-xs md:text-sm mt-1 uppercase tracking-widest">Visual Upgrade Concept</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-800/50">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-cyan-300 font-bold tracking-wider">v2.0 Beta</span>
          </div>
        </div>
      </header>

      {/* Main 3D Scene */}
      <main className="flex-1 relative flex items-center justify-center scene-wrapper">
        <div className="world-plane w-[800px] h-[800px] relative">
          
          {/* World Base / Ground Island */}
          <Cube 
            x={0} y={0} w={800} d={800} h={40}
            style={{ transform: 'translateZ(-40px)' }}
            topClass="bg-gray-950/90 border border-cyan-900/50 backdrop-blur-sm"
            topStyle={{
              backgroundImage: 'linear-gradient(to right, rgba(0, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 255, 255, 0.05) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
            frontClass="bg-gray-900 border-b border-cyan-900/30 shadow-[inset_0_20px_30px_rgba(0,0,0,0.8)]"
            rightClass="bg-gray-900 border-b border-cyan-900/30 shadow-[inset_0_20px_30px_rgba(0,0,0,0.8)]"
            backClass="bg-gray-900 border-b border-cyan-900/30 shadow-[inset_0_20px_30px_rgba(0,0,0,0.8)]"
            leftClass="bg-gray-900 border-b border-cyan-900/30 shadow-[inset_0_20px_30px_rgba(0,0,0,0.8)]"
          />

          {/* Central Road */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[120px] h-full bg-gray-950 border-x-2 border-cyan-500/50"
               style={{ transform: 'translateZ(1px)', boxShadow: '0 0 30px rgba(0,255,255,0.15) inset', transformStyle: 'preserve-3d' }}>
            {/* Dashed line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2"
                 style={{
                   backgroundImage: 'linear-gradient(to bottom, #ffea00 50%, transparent 50%)',
                   backgroundSize: '100% 80px',
                   animation: 'dashScroll 1.5s linear infinite',
                   opacity: 0.6
                 }}
            />
            {/* Cars */}
            <Car isUp={false} left={20} color="#ffea00" delay="0s" />
            <Car isUp={false} left={20} color="#ffea00" delay="-2.5s" />
            <Car isUp={true} right={20} color="#00ffff" delay="-1s" />
            <Car isUp={true} right={20} color="#d946ef" delay="-3.5s" />
          </div>

          {/* Office Tower (Left) */}
          <div className="absolute" style={{ left: 100, top: 250, transformStyle: 'preserve-3d' }}>
            {/* Base Tier */}
            <Cube 
              x={0} y={0} w={160} d={160} h={350}
              topClass="bg-gray-900 border-2 border-cyan-400 shadow-[0_0_30px_rgba(0,255,255,0.4)_inset]"
              frontClass="glass-building-face" rightClass="glass-building-face"
              backClass="glass-building-face" leftClass="glass-building-face"
            />
            {/* Top Tier */}
            <Cube 
              x={20} y={20} w={120} d={120} h={80}
              style={{ transform: 'translateZ(350px)' }}
              topClass="bg-gray-900 border-2 border-fuchsia-400 shadow-[0_0_30px_rgba(217,70,239,0.4)_inset]"
              frontClass="glass-building-face" rightClass="glass-building-face"
              backClass="glass-building-face" leftClass="glass-building-face"
            />
          </div>

          {/* Server Building (Left Front) */}
          <Cube 
            x={140} y={480} w={100} d={120} h={180}
            topClass="bg-gray-900 border-2 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.4)_inset]"
            frontClass="glass-building-face" rightClass="glass-building-face"
            backClass="glass-building-face" leftClass="glass-building-face"
          />

          {/* Neon rings around main tower */}
          <div className="absolute border border-cyan-400/80 shadow-[0_0_20px_#00ffff]"
               style={{ width: 180, height: 180, left: 90, top: 240, transform: 'translateZ(120px)', borderRadius: '2px' }} />
          <div className="absolute border border-fuchsia-400/80 shadow-[0_0_20px_#d946ef]"
               style={{ width: 170, height: 170, left: 95, top: 245, transform: 'translateZ(280px)', borderRadius: '2px' }} />

          {/* CORP Billboard on Tower */}
          <div className="absolute billboard pointer-events-none"
               style={{ left: 180 - 150, top: 330 - 50, width: 300, height: 100, '--z': '480px' } as any}>
            <div className="w-full h-full flex items-center justify-center font-black text-6xl tracking-widest text-fuchsia-400 neon-text">
              CORP
            </div>
          </div>

          {/* Small Houses (Right) */}
          {[
            {x: 520, y: 150, color: '#ec4899'},
            {x: 640, y: 220, color: '#3b82f6'},
            {x: 500, y: 380, color: '#eab308'},
            {x: 620, y: 450, color: '#22c55e'},
            {x: 540, y: 600, color: '#a855f7'},
            {x: 680, y: 350, color: '#06b6d4'},
            {x: 660, y: 620, color: '#f43f5e'},
          ].map((house, i) => (
            <React.Fragment key={i}>
              <Cube 
                x={house.x} y={house.y} w={60} d={60} h={80}
                topClass="neon-roof border-2 border-white/30"
                frontClass="house-face" rightClass="house-face" backClass="house-face" leftClass="house-face"
                style={{ color: house.color }}
              />
              {/* House Light Glow */}
              <div className="absolute w-24 h-24 rounded-full blur-xl pointer-events-none"
                   style={{ left: house.x - 18, top: house.y - 18, backgroundColor: house.color, opacity: 0.15, transform: 'translateZ(5px)' }} />
            </React.Fragment>
          ))}

          {/* Lampposts */}
          {[
            {x: 330, y: 150}, {x: 330, y: 350}, {x: 330, y: 550}, {x: 330, y: 750},
            {x: 470, y: 100}, {x: 470, y: 300}, {x: 470, y: 500}, {x: 470, y: 700},
          ].map((lamp, i) => (
            <div key={`lamp-${i}`} className="absolute"
                 style={{ left: lamp.x, top: lamp.y, transformStyle: 'preserve-3d' }}>
              <div className="absolute w-1 h-[60px] bg-gray-700"
                   style={{ left: -2, top: -30, transform: 'translateZ(30px) rotateX(-90deg)' }} />
              <div className="absolute w-3 h-3 bg-cyan-200 rounded-full shadow-[0_0_20px_8px_rgba(0,255,255,0.6)]"
                   style={{ left: -6, top: -6, transform: 'translateZ(60px)' }} />
              <div className="absolute w-16 h-16 bg-cyan-400/20 rounded-full blur-md pointer-events-none"
                   style={{ left: -32, top: -32, transform: 'translateZ(2px)' }} />
            </div>
          ))}

          {/* Drones */}
          {[
            {x: 200, y: 150, delay: '0s'},
            {x: 700, y: 100, delay: '-1s'},
            {x: 400, y: 600, delay: '-2s'},
          ].map((drone, i) => (
            <div key={`drone-${i}`} className="absolute"
                 style={{ left: drone.x, top: drone.y, animation: `float 2s infinite ease-in-out ${drone.delay}`, transformStyle: 'preserve-3d' }}>
              <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_5px_rgba(255,255,255,0.8)]" 
                   style={{ transform: 'translateZ(150px)' }} />
            </div>
          ))}

          {/* Agents */}
          <Agent x={300} y={400} color="#10b981" name="Alice" delay="0s" />
          <Agent x={490} y={250} color="#f43f5e" name="Bob" delay="-0.5s" />
          <Agent x={600} y={550} color="#3b82f6" name="Charlie" delay="-1s" />
          <Agent x={250} y={600} color="#eab308" name="Dave" delay="-1.5s" />
          <Agent x={500} y={700} color="#a855f7" name="Eve" delay="-2s" />

        </div>
      </main>

      {/* Legend */}
      <footer className="relative z-10 p-4 md:p-6 bg-black/60 backdrop-blur-md border-t border-white/10 flex flex-wrap gap-6 justify-center items-center text-xs md:text-sm">
        <div className="flex items-center gap-2">
          <Building2 className="text-cyan-400 w-4 h-4 md:w-5 md:h-5" />
          <span className="text-gray-300">Office Towers</span>
        </div>
        <div className="flex items-center gap-2">
          <Home className="text-pink-500 w-4 h-4 md:w-5 md:h-5" />
          <span className="text-gray-300">Residential</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="text-green-500 w-4 h-4 md:w-5 md:h-5" />
          <span className="text-gray-300">AI Agents</span>
        </div>
        <div className="flex items-center gap-2">
          <CarIcon className="text-yellow-400 w-4 h-4 md:w-5 md:h-5" />
          <span className="text-gray-300">Transport</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="text-fuchsia-400 w-4 h-4 md:w-5 md:h-5" />
          <span className="text-gray-300">Isometric View</span>
        </div>
      </footer>
    </div>
  );
}
