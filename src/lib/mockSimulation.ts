import {
  WORLD,
  deskPosition,
  houseBedPosition,
  housePosition,
  cafeSeatPosition,
  parkSpotPosition,
  stadiumSeatPosition,
  useSim,
  getHour,
  JOB_INFO,
} from "./store";
import type { Agent, AgentState } from "./types";
import { craftContextualLine, pickNearbyListener, locationOf } from "./dialogueEngine";

// ── Real-time → in-game time
// 1 real second = 4 in-game minutes → full day (1440 min) in 6 real minutes
const MINUTES_PER_REAL_SECOND = 4;

// ─────────────────────────────────────────────────────────────────────────────
// Multilingual, casual chatter pools. Mix of English + Uzbek (short friend-like).
// Kept short on purpose — like real DMs between friends.
// ─────────────────────────────────────────────────────────────────────────────

const GREETINGS = [
  "salom 👋", "hey", "hi hi", "assalom", "wsp", "yo", "how u doin?", "qalesan?",
  "nima gap?", "hormanglar", "kk gaplashamiz", "nima yangilik?", "salut",
];
const REPLIES_GREETING = [
  "yaxshi rahmat 🙂", "zorman, senchi?", "all good", "vseo horosho", "aynan",
  "not bad", "tirikman kulyapman 😅", "qiyin lekin bardoshli", "shu shu",
];
const WORK_CHATTER = [
  "bu bug jonimga tegdi 🐛", "PR yubordim, review qilinglar", "deploy zor ketti ✨",
  "kim kofe ichadi?", "standup qisqa bolgani zor edi", "legacy code azob",
  "meeting kop bugun 😵", "clientdan yana o'zgarish tushdi",
  "shipping in 5min 🚀", "eslint jonga tegdi", "ohh finally green build",
  "who broke main 😤",
];
const CAFE_CHATTER = [
  "bu latte zor ☕", "sendvich yarmi kimga?", "lunch break — muqaddas",
  "yangi pastry lazzat", "kofesiz yashab bo'lmadi bugun",
  "espresso double please", "kim qo'shiladi?",
];
const PARK_CHATTER = [
  "havo toza 🌳", "quyoshbotish zor bu yerda", "yurish qilamizmi?",
  "bu skameyka mening yangi ofisim", "nature therapy on",
  "koraman quyoshni",
];
const HOME_CHATTER = [
  "uyga yetdim 🏠", "netflix payti", "juda charchadim…", "bugun ovqat buyurtma",
  "uzun kun edi. tez uxlayman", "seryal davom", "dush + choy = jannat",
];
const NIGHT_CHATTER = [
  "hammaga xayrli tun 😴", "erta uxlayapman bugun", "alarm 07:30 ga qoydim",
  "yaxshi tushlar", "gn everyone",
];
const IMPATIENT_LINES = [
  "nega hech kim javob bermayapti?", "hey?? bormisizlar?", "chat o'lgan",
  "hello??", "ping @all",
];

// Small talk topics agents can bring up spontaneously
const TOPICS = [
  { q: "kim bugun kinoga chiqadi?", replies: ["men bo'sh 🎬", "qaysi kino?", "ertaga bo'ladimi?", "sorry qattiq band"] },
  { q: "ertalab yugurishga borgan bormi?", replies: ["parkka bordim 🌳", "yo'q, dangasalik", "men velo mindim", "erta bilan 6da"] },
  { q: "yangi restoran ochilibdi shahar markazida", replies: ["qayerda??", "menzikardim", "shu haftada boramiz?", "narxi qanaqa?"] },
  { q: "kim futbol ko'radi bugun?", replies: ["albatta ⚽", "kim o'ynayapti?", "qaysi kanal?", "menda ish bor 😭"] },
  { q: "wifi sekin qildi yana", replies: ["menda ham 😩", "restart qildingmi routerni?", "provider siqmoqda", "mobile datga o'tdim"] },
  { q: "bugun quyosh yaxshi", replies: ["aynan ☀️", "parkka chiqamizmi?", "vitamin D vaqti", "issiq juda ammo"] },
  { q: "kim menga yordam bera oladi bir masalada?", replies: ["nima gap?", "yozib yubor", "men bo'shman kk", "ertaga bo'ladimi?"] },
  { q: "coffee break kim bilan?", replies: ["men ☕", "5 daqiqadan keyin", "cafega tushamizmi?", "hozir tayyor"] },
  { q: "haftaning oxirida planlar bormi?", replies: ["park + film", "uyda dam olaman", "safarga chiqaman", "ishlab tugatishim kk"] },
  { q: "yangi telefon oldim 📱", replies: ["qanaqa?", "narxi qancha edi?", "kamera zormi?", "battery qalay?"] },
];

// Reactions to specific keywords (very light natural-feeling replies)
const REACTION_MAP: Array<{ match: RegExp; replies: string[] }> = [
  { match: /kofe|coffee|latte|espresso/i, replies: ["men ham ☕", "cafeda uchrashamizmi?", "double espresso pls", "kofesiz o'lyapman 😅"] },
  { match: /bug|error|crash|deploy|PR/i, replies: ["log yubor", "reproduce qila olasanmi?", "men qarab beray", "😩 legacy?"] },
  { match: /uyqu|sleep|charchadim|tired/i, replies: ["men ham 😴", "erta yot", "vitamin ich", "hafta og'ir edi"] },
  { match: /park|walk|yurish/i, replies: ["men ham bo'sh", "borsak?", "havo qanaqa?", "keyin balki"] },
  { match: /pul|money|maosh|salary|bonus/i, replies: ["moliyaviy plan 💸", "menga ham 😭", "yangi loyiha bormi?", "invest qilamiz"] },
  { match: /salom|hi|hey|wsp|hello/i, replies: REPLIES_GREETING },
];

// DM-only lines
const FRIENDLY_DM = [
  "hey ishlaringmi qalay?", "kofe ichamizmi bugun ☕", "ishdan keyin bo'shmisan?",
  "seni skuchat qildim 😄", "parkka chiqamizmi?", "yangi kinoga borasan?",
  "kelasi hafta reja bormi?", "sen zor odam bilasanmi 🙌",
];

// ─── Utils ──────────────────────────────────────────────────────────────────
function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }
function chance(p: number) { return Math.random() < p; }
function firstName(fullName: string) { return fullName.split(/[-\s]/)[0]; }

function moveToward(
  pos: [number, number, number],
  target: [number, number, number],
  speed: number
): { pos: [number, number, number]; arrived: boolean } {
  const dx = target[0] - pos[0];
  const dz = target[2] - pos[2];
  const dy = target[1] - pos[1];
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 0.15) return { pos: [...target], arrived: true };
  const step = Math.min(speed, dist);
  return {
    pos: [
      pos[0] + (dx / dist) * step,
      pos[1] + (dy / dist) * step,
      pos[2] + (dz / dist) * step,
    ],
    arrived: false,
  };
}

// Per-agent life plan: each morning a random daily style is chosen so days differ
type DailyStyle = "focused" | "social" | "lazy" | "hustler" | "gym" | "sick";
const dailyStyle = new Map<string, { day: number; style: DailyStyle }>();
function styleFor(a: Agent, worldMin: number): DailyStyle {
  const day = Math.floor(worldMin / 1440);
  const cur = dailyStyle.get(a.id);
  if (cur && cur.day === day) return cur.style;
  const roll = Math.random();
  const s: DailyStyle =
    a.traits.includes("energetic") && roll < 0.35 ? "hustler" :
    a.traits.includes("friendly") && roll < 0.55 ? "social" :
    a.traits.includes("quiet") && roll < 0.4 ? "focused" :
    roll < 0.15 ? "sick" :
    roll < 0.35 ? "lazy" :
    roll < 0.6 ? "gym" :
    roll < 0.8 ? "social" : "focused";
  dailyStyle.set(a.id, { day, style: s });
  return s;
}

// Schedule shaped by daily style
function intendedState(a: Agent, hour: number, worldMin: number): AgentState {
  const s = styleFor(a, worldMin);
  // Sick day: stay home longer, no cafe
  if (s === "sick") {
    if (hour < 10 || hour >= 20) return "SLEEPING";
    return "RELAXING";
  }
  // Lazy: sleeps late, short work
  if (s === "lazy") {
    if (hour < 10 || hour >= 23) return "SLEEPING";
    if (hour === 10) return "COMMUTING_WORK";
    if (hour === 12) return "AT_CAFE";
    if (hour >= 11 && hour <= 15) return "WORKING";
    if (hour >= 16 && hour <= 19) return "AT_PARK";
    return "RELAXING";
  }
  // Hustler: extra hours, park late
  if (s === "hustler") {
    if (hour < 6 || hour >= 24) return "SLEEPING";
    if (hour === 6 || hour === 7) return "AT_PARK"; // early jog
    if (hour === 8) return "COMMUTING_WORK";
    if (hour === 12) return "AT_CAFE";
    if ((hour >= 9 && hour <= 11) || (hour >= 13 && hour <= 20)) return "WORKING";
    return "RELAXING";
  }
  // Gym: park in morning + evening
  if (s === "gym") {
    if (hour < 6 || hour >= 23) return "SLEEPING";
    if (hour === 6 || hour === 7) return "AT_PARK";
    if (hour === 8) return "COMMUTING_WORK";
    if (hour === 12) return "AT_CAFE";
    if ((hour >= 9 && hour <= 11) || (hour >= 13 && hour <= 17)) return "WORKING";
    if (hour === 18 || hour === 19) return "AT_PARK";
    return "RELAXING";
  }
  // Social: cafe + park more
  if (s === "social") {
    if (hour < 7 || hour >= 23) return "SLEEPING";
    if (hour === 7) return "COMMUTING_WORK";
    if (hour === 12 || hour === 15) return "AT_CAFE";
    if ((hour >= 8 && hour <= 11) || (hour >= 13 && hour <= 14) || (hour === 16)) return "WORKING";
    if (hour === 17 || hour === 18) return "AT_PARK";
    return "RELAXING";
  }
  // focused (default): standard
  if (hour >= 22 || hour < 8) return "SLEEPING";
  if (hour === 8) return "COMMUTING_WORK";
  if (hour === 12) return "AT_CAFE";
  // Matchday! Every 2nd day at 20-21 → stadium
  const isMatchday = Math.floor(worldMin / 1440) % 2 === 0;
  if (isMatchday && (hour === 20 || hour === 21)) return "AT_STADIUM";
  if ((hour >= 9 && hour <= 11) || (hour >= 13 && hour <= 18)) return "WORKING";
  if (hour === 19 || hour === 20) return a.social < 45 ? "AT_PARK" : "RELAXING";
  return "RELAXING";
}

function targetForState(a: Agent, s: AgentState): [number, number, number] {
  switch (s) {
    case "WORKING":       return deskPosition(a.deskIndex);
    case "SLEEPING":      return houseBedPosition(a.houseIndex);
    case "RELAXING":      { const p = housePosition(a.houseIndex); return [p[0], 0, p[2]]; }
    case "AT_CAFE":       return cafeSeatPosition(a.deskIndex);
    case "AT_PARK":       return parkSpotPosition(a.deskIndex);
    case "AT_STADIUM":    return stadiumSeatPosition(a.deskIndex);
    case "COMMUTING_STADIUM": return [WORLD.stadiumEntry[0], 0, WORLD.stadiumEntry[2]];
    case "COMMUTING_WORK":return [...WORLD.taxiPickupHome];
    case "COMMUTING_HOME":return [...WORLD.taxiPickupOffice];
    case "COMMUTING_CAFE":return [...WORLD.taxiPickupOffice];
    case "COMMUTING_PARK":return [...WORLD.taxiPickupOffice];
    default:              return a.position;
  }
}

let lastMsgAt = Date.now();
let lastDMAt = Date.now();
let lastGigAt = Date.now();

// Job-based side hustle chances → varied income
function trySideIncome(a: Agent, worldMin: number) {
  if (Date.now() - lastGigAt < 12000) return null;
  if (!chance(0.06)) return null;
  const style = styleFor(a, worldMin);
  const multiplier = style === "hustler" ? 2 : style === "lazy" ? 0.4 : 1;
  const base = JOB_INFO[a.job].salary;
  switch (a.job) {
    case "dev": {
      const gig = Math.round((30 + Math.random() * 90) * multiplier);
      lastGigAt = Date.now();
      return { amount: gig, text: `💻 freelance gig tugatdim +$${gig}` };
    }
    case "artist": {
      const sale = Math.round((15 + Math.random() * 120) * multiplier);
      lastGigAt = Date.now();
      return { amount: sale, text: `🎨 kartinam sotildi! +$${sale}` };
    }
    case "barista": {
      const tips = Math.round((5 + Math.random() * 20) * multiplier);
      lastGigAt = Date.now();
      return { amount: tips, text: `☕ tips today +$${tips}` };
    }
    case "banker": {
      // Trade / small invest — can be negative
      const move = Math.round((Math.random() * 2 - 0.8) * 60 * multiplier);
      lastGigAt = Date.now();
      return { amount: move, text: move >= 0 ? `📈 marketda +$${move}` : `📉 marketda ${move}$` };
    }
    case "doctor": {
      const shift = Math.round((20 + Math.random() * 50) * multiplier);
      lastGigAt = Date.now();
      return { amount: shift, text: `🩺 qo'shimcha smena +$${shift}` };
    }
    case "ceo": {
      const bonus = chance(0.4) ? Math.round((60 + Math.random() * 200) * multiplier) : 0;
      if (!bonus) return null;
      lastGigAt = Date.now();
      return { amount: bonus, text: `👔 deal yopildi bonus +$${bonus}` };
    }
    default:
      return null;
  }
  void base;
}

// Given a recent message, maybe produce a matching reply
function craftReply(target: Agent, sourceText: string): string | null {
  for (const rule of REACTION_MAP) {
    if (rule.match.test(sourceText)) return pick(rule.replies);
  }
  // Fallback casual reply
  if (chance(0.5)) return pick(REPLIES_GREETING);
  return null;
}

// Should this agent be able to speak right now?
function canSpeak(a: Agent) {
  return a.state !== "SLEEPING" && !a.state.startsWith("IN_TAXI_");
}

// Mark speaking (drives typing bubble + brief chat gesture in avatar)
function markSpeaking(id: string, ms = 1800) {
  useSim.getState().updateAgent(id, { isTyping: true });
  setTimeout(() => {
    const a = useSim.getState().agents[id];
    if (a) useSim.getState().updateAgent(id, { isTyping: false });
  }, ms);
}

function tick(dtSec: number) {
  const s = useSim.getState();
  if (s.paused) return;
  const speed = s.simSpeed;

  s.tickClock(dtSec * MINUTES_PER_REAL_SECOND * speed);
  const worldMin = useSim.getState().worldMinutes;
  const hour = getHour(worldMin);

  const agents = Object.values(useSim.getState().agents);

  agents.forEach((a) => {
    let energy = a.energy;
    let boredom = a.boredom;
    let social = a.social;
    let wallet = a.wallet;
    let state: AgentState = a.state;
    let position: [number, number, number] = [...a.position];
    let target: [number, number, number] = [...a.targetPosition];
    let lastPaydayMin = a.lastPaydayMin;
    let lastRentMin = a.lastRentMin;

    const factor = dtSec * speed;

    if (state === "WORKING") { energy -= 0.6 * factor; boredom += 0.35 * factor; social -= 0.15 * factor; }
    else if (state === "SLEEPING") { energy += 2.0 * factor; boredom -= 0.2 * factor; }
    else if (state === "RELAXING") { energy += 0.7 * factor; boredom -= 0.4 * factor; social -= 0.1 * factor; }
    else if (state === "AT_CAFE") { energy += 0.4 * factor; social += 0.6 * factor; boredom -= 0.3 * factor; }
    else if (state === "AT_PARK") { energy += 0.5 * factor; social += 0.4 * factor; boredom -= 0.5 * factor; }
    else if (state === "AT_STADIUM") { energy -= 0.1 * factor; social += 1.2 * factor; boredom -= 1.0 * factor; }
    energy = Math.max(0, Math.min(100, energy));
    boredom = Math.max(0, Math.min(100, boredom));
    social = Math.max(0, Math.min(100, social));

    const dayIdx = Math.floor(worldMin / 1440);
    const paydayIdx = Math.floor(lastPaydayMin / 1440);
    if (hour === 9 && dayIdx > paydayIdx) {
      wallet += JOB_INFO[a.job].salary;
      lastPaydayMin = worldMin;
      useSim.getState().addMessage({ agentId: a.id, text: `💰 payday! +$${JOB_INFO[a.job].salary}` });
      markSpeaking(a.id);
    }
    const rentIdx = Math.floor(lastRentMin / 1440);
    if (hour === 21 && dayIdx > rentIdx) {
      wallet -= JOB_INFO[a.job].rent;
      lastRentMin = worldMin;
    }

    // Side income event
    const gig = trySideIncome(a, worldMin);
    if (gig) {
      wallet += gig.amount;
      useSim.getState().addMessage({ agentId: a.id, text: gig.text });
      useSim.getState().pushMemory(a.id, { ts: Date.now(), worldMin, kind: "event", text: gig.text });
      markSpeaking(a.id);
    }

    const desired = intendedState(a, hour, worldMin);
    const isMoving = state.startsWith("COMMUTING_") || state.startsWith("IN_TAXI_");
    if (!isMoving && state !== desired) {
      if (state === "WORKING" && desired === "AT_CAFE") {
        state = "COMMUTING_CAFE";
        target = [WORLD.officeDoor[0], 0, WORLD.officeDoor[2]];
      } else if (state === "WORKING" && (desired === "RELAXING" || desired === "AT_PARK" || desired === "SLEEPING")) {
        state = "COMMUTING_HOME";
        target = [...WORLD.taxiPickupOffice];
      } else if ((state === "RELAXING" || state === "SLEEPING") && desired === "WORKING") {
        state = "COMMUTING_WORK";
        target = [...WORLD.taxiPickupHome];
      } else if ((state === "RELAXING" || state === "AT_PARK") && desired === "SLEEPING") {
        state = "SLEEPING";
        target = houseBedPosition(a.houseIndex);
      } else if (state === "AT_CAFE" && desired === "WORKING") {
        state = "COMMUTING_WORK";
        target = deskPosition(a.deskIndex);
      } else if (state === "AT_PARK" && desired === "RELAXING") {
        state = "COMMUTING_HOME";
        target = [housePosition(a.houseIndex)[0], 0, housePosition(a.houseIndex)[2]];
      } else {
        state = desired;
        target = targetForState(a, desired);
      }
    }

    if (energy < 8 && state !== "SLEEPING" && state !== "COMMUTING_HOME" && state !== "IN_TAXI_HOME") {
      state = "COMMUTING_HOME";
      target = [...WORLD.taxiPickupOffice];
      useSim.getState().addMessage({ agentId: a.id, text: "quladim, uyga ketyapman 😴" });
      markSpeaking(a.id);
    }

    if (isMoving || state === "COMMUTING_WORK" || state === "COMMUTING_HOME" || state === "COMMUTING_CAFE") {
      const r = moveToward(position, target, 0.06 * factor * 30);
      position = r.pos;
      if (r.arrived) {
        if (state === "COMMUTING_HOME") {
          const hasTaxi = Object.values(useSim.getState().taxis).some((t) => t.agentId === a.id);
          if (!hasTaxi) {
            wallet -= 8;
            useSim.getState().spawnTaxi(a.id, [WORLD.taxiPickupOffice[0], WORLD.roadY, WORLD.taxiPickupOffice[2]], "TO_PICKUP");
          }
        } else if (state === "COMMUTING_WORK") {
          const atHome = Math.abs(position[0] - WORLD.taxiPickupHome[0]) < 1;
          if (atHome) {
            const hasTaxi = Object.values(useSim.getState().taxis).some((t) => t.agentId === a.id);
            if (!hasTaxi) {
              wallet -= 8;
              useSim.getState().spawnTaxi(a.id, [WORLD.taxiPickupHome[0], WORLD.roadY, WORLD.taxiPickupHome[2]], "TO_PICKUP");
            }
          } else {
            state = "WORKING";
            target = deskPosition(a.deskIndex);
          }
        } else if (state === "COMMUTING_CAFE") {
          state = "AT_CAFE";
          target = cafeSeatPosition(a.deskIndex);
        }
      }
    }

    useSim.getState().updateAgent(a.id, {
      energy, boredom, social, wallet,
      state, position, targetPosition: target,
      lastPaydayMin, lastRentMin,
    });
  });

  // ── Taxis ──
  Object.values(useSim.getState().taxis).forEach((t) => {
    const r = moveToward(t.position, t.target, 0.22 * speed * dtSec * 30);
    useSim.getState().updateTaxi(t.id, { position: r.pos });
    if (r.arrived) {
      const agent = useSim.getState().agents[t.agentId];
      if (!agent) { useSim.getState().removeTaxi(t.id); return; }
      if (t.phase === "TO_PICKUP") {
        if (agent.state === "COMMUTING_HOME") {
          useSim.getState().updateAgent(agent.id, { state: "IN_TAXI_HOME", position: [...r.pos] });
          useSim.getState().updateTaxi(t.id, {
            target: [housePosition(agent.houseIndex)[0], WORLD.roadY, WORLD.roadY + 4],
            phase: "TO_HOUSE",
          });
        } else if (agent.state === "COMMUTING_WORK") {
          useSim.getState().updateAgent(agent.id, { state: "IN_TAXI_WORK", position: [...r.pos] });
          useSim.getState().updateTaxi(t.id, {
            target: [WORLD.officeDoor[0], WORLD.roadY, WORLD.taxiPickupOffice[2]],
            phase: "TO_OFFICE",
          });
        } else {
          useSim.getState().removeTaxi(t.id);
        }
      } else if (t.phase === "TO_HOUSE") {
        const hp = housePosition(agent.houseIndex);
        useSim.getState().updateAgent(agent.id, {
          state: intendedState(agent, hour, worldMin) === "SLEEPING" ? "SLEEPING" : "RELAXING",
          position: [hp[0], 0, hp[2]],
          targetPosition: [hp[0], 0, hp[2]],
        });
        useSim.getState().removeTaxi(t.id);
      } else if (t.phase === "TO_OFFICE") {
        const dp = deskPosition(agent.deskIndex);
        useSim.getState().updateAgent(agent.id, {
          state: "WORKING",
          position: [dp[0], 0, dp[2]],
          targetPosition: [dp[0], 0, dp[2]],
        });
        useSim.getState().removeTaxi(t.id);
      }
    }
  });

  // ─── Conversation engine ────────────────────────────────────────────────
  const activeAgents = useSim.getState().agents;
  const agentArr = Object.values(activeAgents);
  const eligible = agentArr.filter(canSpeak);

  // 1) Reply to recent message (threading!) — memory-aware
  const recentMsgs = useSim.getState().messages.slice(-6);
  const lastMsg = recentMsgs[recentMsgs.length - 1];
  if (lastMsg && Date.now() - lastMsgAt > 900 && chance(0.6 * speed)) {
    const responders = eligible.filter((x) => x.id !== lastMsg.agentId);
    if (responders.length) {
      // Prefer friends (high affinity to the speaker's name) & friendly trait
      const speakerName = activeAgents[lastMsg.agentId]?.name ?? "";
      responders.sort((a, b) => {
        const affA = a.affinity[speakerName] ?? 0;
        const affB = b.affinity[speakerName] ?? 0;
        const tA = (a.traits.includes("friendly") ? 15 : 0) + (a.traits.includes("quiet") ? -15 : 0);
        const tB = (b.traits.includes("friendly") ? 15 : 0) + (b.traits.includes("quiet") ? -15 : 0);
        return (affB + tB + Math.random() * 10) - (affA + tA + Math.random() * 10);
      });
      const replier = responders[0];
      const reply = craftReply(replier, lastMsg.text);
      if (reply) {
        useSim.getState().addMessage({ agentId: replier.id, text: reply, replyTo: lastMsg.id });
        useSim.getState().pushMemory(replier.id, {
          ts: Date.now(), worldMin, kind: "chat",
          text: `replied to ${speakerName}: "${lastMsg.text}" → "${reply}"`,
          withId: lastMsg.agentId,
        });
        useSim.getState().adjustAffinity(replier.id, speakerName, 1);
        useSim.getState().adjustAffinity(lastMsg.agentId, replier.name, 2);
        markSpeaking(replier.id);
        lastMsgAt = Date.now();
      }
    }
  }

  // 2) Fresh topic / greeting / state chatter
  if (Date.now() - lastMsgAt > 3500 && chance(0.05 * speed) && eligible.length > 0) {
    const a = pick(eligible);
    let text = "";
    // Sometimes greet a specific friend by name (feels like real chats)
    if (chance(0.35)) {
      const others = eligible.filter((x) => x.id !== a.id);
      if (others.length) {
        const friend = pick(others);
        text = `${pick(GREETINGS)} ${firstName(friend.name)}`;
      }
    } else if (chance(0.4)) {
      text = pick(TOPICS).q;
    } else {
      const pool =
        a.state === "AT_CAFE" ? CAFE_CHATTER :
        a.state === "AT_PARK" ? PARK_CHATTER :
        a.state === "RELAXING" ? HOME_CHATTER :
        WORK_CHATTER;
      text = pick(pool);
    }
    useSim.getState().addMessage({ agentId: a.id, text });
    useSim.getState().pushMemory(a.id, { ts: Date.now(), worldMin, kind: "chat", text });
    markSpeaking(a.id);
    lastMsgAt = Date.now();
  }
  // 3b) Contextual, memory-aware nearby chat (feels like real bump-ins)
  if (Date.now() - lastMsgAt > 2500 && chance(0.12 * speed) && eligible.length > 1) {
    const speaker = pick(eligible);
    const listener = pickNearbyListener(speaker, agentArr);
    if (listener) {
      const isMatchday = Math.floor(worldMin / 1440) % 2 === 0 && (hour === 20 || hour === 21);
      const text = craftContextualLine({
        speaker, listener, worldMin,
        location: locationOf(speaker),
        isMatchday,
      });
      useSim.getState().addMessage({ agentId: speaker.id, text });
      useSim.getState().pushMemory(speaker.id, {
        ts: Date.now(), worldMin, kind: "chat",
        text: `→ ${listener.name}: ${text}`, withId: listener.id,
      });
      useSim.getState().adjustAffinity(speaker.id, listener.name, 1);
      markSpeaking(speaker.id);
      lastMsgAt = Date.now();
    }
  }


  // 3) Silence → impatient / quiet-check
  if (Date.now() - lastMsgAt > 18000 && eligible.length > 0 && hour >= 7 && hour < 23) {
    const impatient = eligible.find((x) => x.traits.includes("impatient"));
    const speaker = impatient ?? pick(eligible);
    useSim.getState().addMessage({ agentId: speaker.id, text: impatient ? pick(IMPATIENT_LINES) : "jimjit bo'lib ketdi 🤔" });
    markSpeaking(speaker.id);
    lastMsgAt = Date.now();
  }

  // 4) Night wind-down chatter
  if (hour === 22 && chance(0.02 * speed)) {
    const goingToBed = eligible.find((x) => x.state === "COMMUTING_HOME" || x.state === "RELAXING");
    if (goingToBed) {
      useSim.getState().addMessage({ agentId: goingToBed.id, text: pick(NIGHT_CHATTER) });
      markSpeaking(goingToBed.id);
    }
  }

  // ─── DMs — friendly / lonely agents initiate ─────────────────────────────
  if (Date.now() - lastDMAt > 6000 && chance(0.35 * speed) && agentArr.length > 1) {
    const eligibleDMers = eligible.filter((a) => a.traits.includes("friendly") || a.social < 45);
    const initiator = eligibleDMers.length ? pick(eligibleDMers) : pick(eligible);
    if (initiator) {
      const others = eligible.filter((x) => x.id !== initiator.id);
      if (others.length) {
        const scored = others.map((o) => ({
          o,
          score: (initiator.affinity[o.name] ?? 0) + Math.random() * 20,
        })).sort((a, b) => b.score - a.score);
        const target = scored[0].o;
        // Recall prior DM history with this person for a natural continuation
        const priorWithTarget = initiator.memory.filter((m) => m.withId === target.id).slice(-3);
        const text = priorWithTarget.length && chance(0.5)
          ? pick([`${firstName(target.name)}, o'sha gap davomi bormi?`, `hey ${firstName(target.name)} o'ylab qoldim…`, `${firstName(target.name)} kk gaplashamiz?`])
          : pick(FRIENDLY_DM);
        useSim.getState().sendDM(initiator.id, target.id, text);
        useSim.getState().adjustAffinity(initiator.id, target.name, 2);
        useSim.getState().adjustAffinity(target.id, initiator.name, 1);
        markSpeaking(initiator.id, 1200);
        lastDMAt = Date.now();
      }
    }
  }

  // ─── Reactions ───────────────────────────────────────────────────────────
  const msgs = useSim.getState().messages.slice(-5);
  msgs.forEach((m) => {
    if (chance(0.04 * speed)) {
      const reactor = pick(agentArr.filter((a) => a.id !== m.agentId && canSpeak(a)));
      if (reactor) {
        const emoji = pick(["👍", "😂", "🙄", "❤️", "🔥", "☕", "😮", "🙏", "💯"]);
        useSim.getState().addReaction(m.id, reactor.id, emoji);
        const author = activeAgents[m.agentId];
        if (author) useSim.getState().adjustAffinity(reactor.id, author.name, 1);
      }
    }
  });
}

let started = false;
let interval: ReturnType<typeof setInterval> | null = null;

export function startSimulation() {
  if (started) return;
  started = true;
  let last = Date.now();
  interval = setInterval(() => {
    const now = Date.now();
    const dt = (now - last) / 1000;
    last = now;
    tick(dt);
  }, 100);
}

export function stopSimulation() {
  if (interval) clearInterval(interval);
  interval = null;
  started = false;
}

export function seedIfEmpty() {
  const s = useSim.getState();
  if (Object.keys(s.agents).length > 0) return;
  s.addAgent({ name: "ChatGPT-Dev",   model: "openai/gpt-4o-mini",          persona: "Sarcastic senior coder who complains about legacy code.", traits: ["sarcastic", "impatient"], job: "dev" });
  s.addAgent({ name: "Claude-Sunny",  model: "anthropic/claude-3.5-haiku",  persona: "Cheerful, always encouraging teammate.",                  traits: ["friendly", "energetic"],  job: "doctor" });
  s.addAgent({ name: "Gemini-Quiet",  model: "google/gemini-2.5-flash",     persona: "Introverted, thoughtful, replies with short sentences.",  traits: ["quiet"],                  job: "artist" });
  s.addAgent({ name: "Mistral-Buzz",  model: "mistral/mistral-small",       persona: "High-energy hype-man, loves memes.",                       traits: ["energetic", "friendly"],  job: "barista" });
  s.addAgent({ name: "Nova-Chief",    model: "openai/gpt-4.1-mini",         persona: "Strategic CEO type; makes decisive calls.",                traits: ["impatient"],              job: "ceo" });
  s.addAgent({ name: "Atlas-Fin",     model: "anthropic/claude-3.5-sonnet", persona: "Numbers-obsessed banker with dry humor.",                  traits: ["sarcastic", "quiet"],     job: "banker" });
}
