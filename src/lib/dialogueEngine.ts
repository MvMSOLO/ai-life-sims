// Contextual dialogue engine — memory-aware, affinity-flavored, short like real chat.
import type { Agent, MemoryEntry } from "./types";

function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }
function firstName(n: string) { return n.split(/[-\s]/)[0]; }

const HELLO_UZ = ["salom", "hey", "hi", "assalom", "qalesan"];
const CALLBACK_UZ = ["oldingi gap davomi bormi?", "kecha gaplashganimiz esimda", "o'sha reja qanaqa?", "esimga tushib qoldi"];
const STATUS_TIRED = ["charchaganga o'xshaysan", "uxlab olishing kk", "kayfiyat qanaqa?"];
const STATUS_LOW_WALLET = ["pul masalasi qanaqa?", "yordam kk bo'lsa ayt", "gig bormi?"];
const STATUS_HAPPY = ["kayfiyat zor ko'rinadi ✨", "yaxshi ko'rinasan bugun"];
const FOOTY = ["Hala Madrid! ⚪", "bu penalti emas edi", "Vamos!", "goool 🔥", "hakam ko'r"];
const JOB_BANTER: Record<string, string[]> = {
  dev: ["yana bug 🐛", "PR review qil pls", "prod down emas?", "ship qildik 🚀"],
  doctor: ["smena og'ir", "bemor kop bugun", "kofe kk urgently ☕"],
  ceo: ["deal yopildi bugun", "meetingdan chiqdim", "Q4 numbers zor"],
  barista: ["ertaga smena qanaqa?", "tips yaxshi tushdi ☕", "yangi blend keldi"],
  banker: ["market bugun qizdi 📈", "portfolio bardosh", "Fed nima deydi?"],
  artist: ["yangi ish boshladim 🎨", "galereyaga chiqarasanmi?", "inspiratsiya qidiryapman"],
};

export interface DialogueCtx {
  speaker: Agent;
  listener: Agent;
  worldMin: number;
  location: "office" | "cafe" | "park" | "home" | "bank" | "stadium" | "street";
  isMatchday: boolean;
}

// Choose a line contextually based on shared memory + state + affinity + location.
export function craftContextualLine(ctx: DialogueCtx): string {
  const { speaker, listener, worldMin, location, isMatchday } = ctx;
  const listenerName = firstName(listener.name);

  // Match at stadium — banter dominates
  if (location === "stadium" || isMatchday) {
    return pick(FOOTY);
  }

  // Look at memory with this specific listener
  const shared: MemoryEntry[] = speaker.memory
    .filter((m) => m.withId === listener.id)
    .slice(-6);

  const today = Math.floor(worldMin / 1440);
  const metToday = shared.some((m) => Math.floor(m.worldMin / 1440) === today);
  const aff = speaker.affinity[listener.name] ?? 0;

  // First time meeting today — greet with name
  if (!metToday) {
    return `${pick(HELLO_UZ)} ${listenerName}`;
  }

  // Status check based on listener bars
  if (listener.energy < 30) return `${listenerName}, ${pick(STATUS_TIRED)}`;
  if (listener.wallet < 60) return `${listenerName}, ${pick(STATUS_LOW_WALLET)}`;
  if (listener.social > 75 && aff > 20) return `${listenerName}, ${pick(STATUS_HAPPY)}`;

  // Callback to prior conversation
  if (shared.length >= 2 && Math.random() < 0.5) {
    return `${listenerName}, ${pick(CALLBACK_UZ)}`;
  }

  // Location-flavored small talk
  if (location === "cafe") return pick(["yana kofe? ☕", "bu latte zor", "lunch birga?"]);
  if (location === "park") return pick(["havo toza 🌳", "yurish qilamizmi?", "sokin joy"]);
  if (location === "bank") return pick(["queue uzun 🏦", "kartada muammo yo'q?", "ATM ishlayaptimi?"]);
  if (location === "home") return pick(["dam olish payti", "seryal ko'ryapsanmi?", "chy ichamizmi?"]);

  // Job banter
  const banter = JOB_BANTER[speaker.job];
  if (banter) return pick(banter);
  return `${listenerName}, nima gap?`;
}

export function pickNearbyListener(speaker: Agent, all: Agent[]): Agent | null {
  const [sx, , sz] = speaker.position;
  const near = all.filter((a) => {
    if (a.id === speaker.id) return false;
    if (a.state === "SLEEPING") return false;
    if (a.state.startsWith("IN_TAXI_")) return false;
    const [x, , z] = a.position;
    const d = Math.hypot(x - sx, z - sz);
    return d < 5.5;
  });
  if (!near.length) return null;
  // Prefer highest affinity
  near.sort((a, b) => (speaker.affinity[b.name] ?? 0) - (speaker.affinity[a.name] ?? 0));
  return near[0];
}

export function locationOf(a: Agent): DialogueCtx["location"] {
  switch (a.state) {
    case "WORKING": return "office";
    case "AT_CAFE": return "cafe";
    case "AT_PARK": return "park";
    case "SLEEPING":
    case "RELAXING": return "home";
    case "AT_STADIUM": return "stadium";
    default: return "street";
  }
}
