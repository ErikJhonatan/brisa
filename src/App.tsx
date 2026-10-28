import { useEffect, useRef, useState } from "react";
import { Button, Switch } from "@heroui/react";
import { animate, createScope, stagger } from "animejs";
import NumberFlow from "@number-flow/react";
import { Drawer } from "vaul";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Flower2,
  Heart,
  Home,
  Leaf,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Square,
  Sun,
  Vibrate,
  Wind,
  X,
} from "lucide-react";
import Mascot from "./Mascot";
import {
  phaseAt,
  practices,
  isBreathing,
  withoutHolds,
  type Practice,
} from "./breathing";
import AudioPanel from "./AudioPanel";
import { SoundEngine, tracks, type AudioSettings } from "./audio";
import {
  loadSettings,
  defaults,
  localDate,
  weekDates,
  calendarFile,
  downloadFile,
  clearLegacyVoiceData,
  type Settings,
} from "./storage";
import { voiceGuides, narrator } from "./voices";
import { Music2, Star, Download, Trash2, BookOpen, Bell } from "lucide-react";

type Page = "home" | "practices" | "session";
type Entry = {
  date: string;
  name: string;
  minutes: number;
  before?: number;
  after?: number;
  feeling?: string;
};
const icons = { sun: Sun, square: Square, moon: Moon, leaf: Leaf };
function readHistory(): Entry[] {
  try {
    const value = JSON.parse(localStorage.getItem("brisa-history") || "[]");
    return Array.isArray(value)
      ? value.filter(
          (v) =>
            typeof v.date === "string" &&
            typeof v.name === "string" &&
            typeof v.minutes === "number",
        )
      : [];
  } catch {
    return [];
  }
}
function vibrate(pattern: number | number[]) {
  try {
    return navigator.vibrate?.(pattern) ?? false;
  } catch {
    return false;
  }
}

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [selected, setSelected] = useState(practices[0]);
  const [drawer, setDrawer] = useState<
    "practice" | "settings" | "space" | "science" | null
  >(null);
  const [minutes, setMinutes] = useState(1);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const haptics = settings.haptics;
  const reduced = settings.reduced;
  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.dark);
    document.documentElement.style.colorScheme = settings.dark ? "dark" : "light";
  }, [settings.dark]);
  const setHaptics = (haptics: boolean) =>
    setSettings((s) => ({ ...s, haptics }));
  const setReduced = (reduced: boolean) =>
    setSettings((s) => ({ ...s, reduced }));
  const [before, setBefore] = useState<number | undefined>();
  const [after, setAfter] = useState<number | undefined>();
  const [noHolds, setNoHolds] = useState(false);
  const [preview, setPreview] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [narrating, setNarrating] = useState(false);
  const [introPaused, setIntroPaused] = useState(false);
  const [scriptTexts, setScriptTexts] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [reminderDue, setReminderDue] = useState(false);
  const [planDay, setPlanDay] = useState(() => (new Date().getDay() + 6) % 7);
  const [downloadStatus, setDownloadStatus] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [systemReduced, setSystemReduced] = useState(false);
  const [filter, setFilter] = useState("Todas");
  const [mood, setMood] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [complete, setComplete] = useState(false);
  const [history, setHistory] = useState<Entry[]>(readHistory);
  const [storageNote, setStorageNote] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const orb = useRef<HTMLDivElement>(null);
  const elapsedRef = useRef(0);
  const finished = useRef(false);
  const engine = useRef<SoundEngine | null>(null);
  const voicePlayer = useRef<HTMLAudioElement | null>(null);
  const sessionDate = useRef("");
  const hasHaptics = typeof navigator.vibrate === "function";
  const quiet = reduced || systemReduced;
  const total = minutes * 60;
  const sessionPractice = noHolds ? withoutHolds(selected) : selected;
  const phase = phaseAt(
    sessionPractice,
    elapsed *
      (isBreathing(selected)
        ? 1
        : selected.phases.reduce((sum, p) => sum + p.seconds, 0) / total),
  );
  const phaseDuration = isBreathing(selected)
    ? phase.remaining
    : (phase.remaining * total) /
      selected.phases.reduce((sum, p) => sum + p.seconds, 0);
  const remaining = Math.max(0, total - elapsed);
  const guide = voiceGuides[selected.id];
  useEffect(() => {
    let active = true;
    void fetch("/voices/scripts.json")
      .then((r) => {
        if (!r.ok) throw new Error("Guiones no disponibles");
        return r.json();
      })
      .then((data) => {
        if (active)
          setScriptTexts(
            Object.fromEntries(
              data.scripts.map((s: { id: string; text: string }) => [
                s.id,
                s.text,
              ]),
            ),
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (narrating && !settings.voice) skipIntro();
  }, [settings.voice, narrating]);

  useEffect(() => {
    try {
      localStorage.setItem("brisa-history", JSON.stringify(history));
    } catch {
      setStorageNote("Tu navegador no permite guardar el historial.");
    }
  }, [history]);
  useEffect(() => {
    if (complete && sessionDate.current)
      setHistory((previous) =>
        previous.map((entry) =>
          entry.date === sessionDate.current
            ? { ...entry, after, feeling: mood ?? undefined }
            : entry,
        ),
      );
  }, [complete, after, mood]);

  useEffect(() => {
    const sound = new SoundEngine();
    sound.onError = setAudioError;
    engine.current = sound;
    return () => {
      void sound.dispose();
      voicePlayer.current?.pause();
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("brisa-settings", JSON.stringify(settings));
    } catch {
      setStorageNote("Los ajustes no se pudieron guardar en este navegador.");
    }
  }, [settings]);
  useEffect(() => {
    engine.current?.configure(settings.audio);
    if (running || preview) engine.current?.start(settings.audio);
  }, [settings.audio, running, preview]);
  useEffect(() => {
    if (!running && !preview) engine.current?.stop();
    if (!running && !narrating) voicePlayer.current?.pause();
  }, [running, preview, narrating]);
  useEffect(() => {
    if (drawer === null) {
      setPreview(false);
      setDeleteConfirm(false);
    }
  }, [drawer]);
  useEffect(() => {
    voicePlayer.current?.pause();
    voicePlayer.current = null;
    if (guide?.available) {
      const audio = new Audio(guide.file);
      // Start the request on play, after the offline worker has taken control.
      // An early partial metadata request can be interrupted by worker activation.
      audio.preload = "none";
      audio.volume = settings.voiceVolume;
      voicePlayer.current = audio;
    }
    return () => {
      voicePlayer.current?.pause();
    };
  }, [selected.id]);
  useEffect(() => {
    if (voicePlayer.current) voicePlayer.current.volume = settings.voiceVolume;
  }, [settings.voiceVolume]);
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      try {
        if (
          settings.reminderEnabled &&
          time >= settings.reminder &&
          localStorage.getItem("brisa-reminder-day") !== localDate(now)
        ) {
          setReminderDue(true);
          localStorage.setItem("brisa-reminder-day", localDate(now));
        }
      } catch {
        /* Reminder remains optional. */
      }
    };
    check();
    const timer = setInterval(check, 30000);
    return () => clearInterval(timer);
  }, [settings.reminder, settings.reminderEnabled]);

  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (quiet) return;
    const scope = createScope({ root }).add(() => {
      animate(".hero-card, .session-title", {
        opacity: [0.65, 1],
        translateY: [8, 0],
        duration: 500,
        ease: "outExpo",
      });
    });
    return () => scope.revert();
  }, [page, quiet]);

  useEffect(() => {
    if (page !== "practices" || quiet) return;
    const scope = createScope({ root }).add(() => {
      animate(".practice-card", {
        translateX: [8, 0],
        opacity: [0.7, 1],
        delay: stagger(35),
        duration: 300,
        ease: "outExpo",
      });
    });
    return () => scope.revert();
  }, [filter, page, quiet]);

  useEffect(() => {
    if (!running) return;
    const start = performance.now() - elapsedRef.current * 1000;
    const tick = setInterval(() => {
      const next = Math.min(
        total,
        Math.floor((performance.now() - start) / 1000),
      );
      elapsedRef.current = next;
      setElapsed(next);
      if (next >= total && !finished.current) {
        finished.current = true;
        setRunning(false);
        setComplete(true);
        vibrate(0);
        const entry = {
          date: sessionDate.current,
          name: selected.name,
          minutes,
          before,
        };
        setHistory((previous) => [entry, ...previous].slice(0, 500));
      }
    }, 100);
    return () => clearInterval(tick);
  }, [running, total, selected, minutes, before]);

  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        setRunning(false);
        setPreview(false);
        engine.current?.stop();
        voicePlayer.current?.pause();
        if (voicePlayer.current && !voicePlayer.current.ended)
          setIntroPaused(true);
        vibrate(0);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);

  useEffect(() => {
    if (!running || complete || page !== "session") {
      vibrate(0);
      return;
    }
    if (haptics) vibrate(phase.haptic);
    engine.current?.breath(phase.label, phaseDuration);
    const animation =
      !quiet && orb.current
        ? animate(orb.current, {
            scale: phase.scale,
            duration: phaseDuration * 1000,
            ease: "inOutSine",
          })
        : null;
    return () => {
      animation?.pause();
      engine.current?.stopBreath();
      vibrate(0);
    };
    // Recreate only at phase boundaries; restarting each tick would break pacing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    running,
    phase.index,
    haptics,
    quiet,
    complete,
    page,
    settings.audio.breath,
    settings.audio.breathVolume,
  ]);

  function go(next: Page) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function choose(practice: Practice) {
    if (page === "session") {
      voicePlayer.current?.pause();
      if (voicePlayer.current) {
        voicePlayer.current.onended = null;
        voicePlayer.current.onerror = null;
      }
      setNarrating(false);
      setIntroPaused(false);
      setRunning(false);
      elapsedRef.current = 0;
      setElapsed(0);
      setComplete(false);
    }
    setSelected(practice);
    setMinutes(practice.minutes);
    setBefore(undefined);
    setNoHolds(false);
    setDrawer("practice");
  }
  async function unlockAudio() {
    try {
      await engine.current?.unlock();
      setAudioError("");
    } catch {
      setAudioError(
        "El audio no está disponible en este navegador. La guía visual sigue funcionando.",
      );
    }
  }
  async function start() {
    await unlockAudio();
    setPreview(false);
    sessionDate.current = new Date().toISOString();
    if (voicePlayer.current) voicePlayer.current.currentTime = 0;
    setDrawer(null);
    setElapsed(0);
    elapsedRef.current = 0;
    finished.current = false;
    setComplete(false);
    setMood(null);
    setAfter(undefined);
    setRunning(false);
    go("session");
    if (settings.voice && guide?.available && voicePlayer.current) {
      const player = voicePlayer.current;
      setNarrating(true);
      setIntroPaused(false);
      player.onended = () => {
        setNarrating(false);
        setRunning(!document.hidden);
      };
      player.onerror = () => {
        setNarrating(false);
        setRunning(!document.hidden);
        setAudioError(
          "No se pudo cargar la narración de ElevenLabs. Puedes seguir con la guía visual.",
        );
      };
      try {
        await player.play();
      } catch {
        setNarrating(false);
        setRunning(true);
        setAudioError(
          "No se pudo reproducir la voz. Puedes continuar con la guía visual.",
        );
      }
    } else {
      setNarrating(false);
      setRunning(true);
    }
  }
  function leave() {
    setRunning(false);
    setPreview(false);
    engine.current?.stop();
    voicePlayer.current?.pause();
    if (voicePlayer.current) {
      voicePlayer.current.onended = null;
      voicePlayer.current.onerror = null;
    }
    setNarrating(false);
    setIntroPaused(false);
    vibrate(0);
    go("home");
  }
  async function togglePreview() {
    if (preview) {
      setPreview(false);
      engine.current?.stop();
    } else {
      await unlockAudio();
      setPreview(true);
      engine.current?.start(settings.audio);
    }
  }
  function audioPanel() {
    return (
      <AudioPanel
        value={settings.audio}
        onChange={(audio: AudioSettings) =>
          setSettings((s) => ({ ...s, audio }))
        }
        preview={preview}
        onPreview={() => void togglePreview()}
      />
    );
  }
  function skipIntro() {
    voicePlayer.current?.pause();
    if (voicePlayer.current) {
      voicePlayer.current.onended = null;
      voicePlayer.current.onerror = null;
    }
    setNarrating(false);
    setIntroPaused(false);
    setRunning(true);
  }
  async function cacheMusic() {
    setDownloading(true);
    setDownloadStatus("Guardando las cuatro pistas…");
    try {
      const cache = await caches.open("brisa-media-v1");
      await Promise.all(
        tracks
          .filter((t) => t.file)
          .map((t) => cache.add(new Request(t.file, { cache: "reload" }))),
      );
      setDownloadStatus(
        "Las cuatro pistas están guardadas para escuchar sin conexión.",
      );
    } catch {
      setDownloadStatus(
        "No se completó la descarga. Revisa tu conexión y espacio disponible e inténtalo de nuevo.",
      );
    } finally {
      setDownloading(false);
    }
  }
  function toggleFavorite() {
    setSettings((s) => ({
      ...s,
      favorites: s.favorites.includes(selected.id)
        ? s.favorites.filter((id) => id !== selected.id)
        : [...s.favorites, selected.id],
    }));
  }
  const week = weekDates();
  const activeDays = new Set(history.map((entry) => localDate(entry.date)));
  const weekCount = week.filter((date) => activeDays.has(date)).length;
  const recommendations = [...practices]
    .filter((p) => p.id !== "sigh")
    .sort(
      (a, b) =>
        Number(settings.favorites.includes(b.id)) -
          Number(settings.favorites.includes(a.id)) ||
        history.filter(
          (e) => e.name === b.name && (e.before ?? 0) > (e.after ?? 10),
        ).length -
          history.filter(
            (e) => e.name === a.name && (e.before ?? 0) > (e.after ?? 10),
          ).length,
    )
    .slice(0, 2);
  const paired = history.filter(
    (e) => e.before !== undefined && e.after !== undefined,
  );
  const averageBefore = paired.length
    ? paired.reduce((sum, e) => sum + e.before!, 0) / paired.length
    : 0;
  const averageAfter = paired.length
    ? paired.reduce((sum, e) => sum + e.after!, 0) / paired.length
    : 0;
  const plan = ["sigh", "mindful", "body", "slow", "muscle", "kind", "ground"];
  function setVibration(value: boolean) {
    setHaptics(value);
    if (value) vibrate([60, 80, 60]);
    else vibrate(0);
  }
  function practiceCard(practice: Practice, compact = false) {
    const Icon = icons[practice.icon];
    return (
      <button
        key={practice.id}
        className={`practice-card ${practice.tone} ${compact ? "compact" : ""}`}
        onClick={() => choose(practice)}
      >
        <div className="practice-art">
          <Icon size={compact ? 28 : 36} strokeWidth={1.4} />
          {!compact && <span className="art-ring" />}
        </div>
        <div className="practice-copy">
          <span className="technique-label">{practice.subtitle}</span>
          <h3>{practice.name}</h3>
          {settings.favorites.includes(practice.id) && (
            <span className="favorite-marker">
              <Star size={12} fill="currentColor" /> Favorita
            </span>
          )}
          {!compact && <p>{practice.description}</p>}
          <span className="duration">
            <Clock3 size={13} />
            {practice.minutes} min <span>· {practice.category}</span>
          </span>
        </div>
        <span className="card-arrow">
          <ArrowRight size={18} />
        </span>
      </button>
    );
  }

  return (
    <div ref={root} className={`app ${quiet ? "reduce-motion" : ""}`}>
      <a href="#main" className="skip-link">
        Ir al contenido
      </a>
      {page !== "session" && (
        <header className="header">
          <button
            className="wordmark"
            aria-label="Brisa, inicio"
            onClick={() => go("home")}
          >
            <Flower2 size={29} strokeWidth={1.6} />
            brisa<span>un poquito de paz</span>
          </button>
          <Button
            isIconOnly
            variant="light"
            radius="full"
            aria-label="Abrir ajustes"
            className="settings-button"
            onPress={() => setDrawer("settings")}
          >
            <Settings2 size={21} />
          </Button>
        </header>
      )}
      <main id="main" tabIndex={-1}>
        {page === "home" && (
          <div className="page home-page">
            {reminderDue && (
              <div className="reminder-banner" role="status">
                <Bell size={19} />
                <p>Es un buen momento para tu pausa.</p>
                <button
                  aria-label="Descartar recordatorio"
                  onClick={() => setReminderDue(false)}
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <section className="greeting reveal">
              <h1>
                Baja el ritmo.
                <br />
                Vuelve a ti.
              </h1>
              <p>Una pausa breve puede ser un buen comienzo.</p>
            </section>
            <section className="daily-plan">
              <div className="section-heading">
                <h2>Tu semana, a tu ritmo</h2>
                <button
                  className="text-button"
                  onClick={() => setDrawer("space")}
                >
                  {weekCount}/{settings.goal} días
                </button>
              </div>
              <div className="week-strip">
                {["L", "M", "M", "J", "V", "S", "D"].map((day, i) => (
                  <button
                    key={i}
                    aria-label={`Día ${i + 1}: ${practices.find((p) => p.id === plan[i])?.name}`}
                    className={`${activeDays.has(week[i]) ? "done" : ""} ${planDay === i ? "selected" : ""}`}
                    onClick={() => setPlanDay(i)}
                  >
                    <span>{day}</span>
                    <span>
                      {activeDays.has(week[i]) ? <Check size={17} /> : i + 1}
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="plan-recommendation"
                onClick={() =>
                  choose(practices.find((p) => p.id === plan[planDay])!)
                }
              >
                <span>
                  <strong>
                    {practices.find((p) => p.id === plan[planDay])?.name}
                  </strong>
                  <small>Práctica sugerida para el día {planDay + 1}</small>
                </span>
                <Play size={18} />
              </button>
            </section>
            <section className="hero-card reveal">
              <div className="hero-art">
                <span className="hero-cloud cloud-one" />
                <span className="hero-cloud cloud-two" />
                <Mascot still={quiet} />
              </div>
              <div className="hero-copy">
                <h2>Respira conmigo</h2>
                <p>
                  Prueba el suspiro cíclico.
                  <br />
                  Yo te acompaño.
                </p>
                <Button
                  color="primary"
                  className="primary-button"
                  radius="lg"
                  onPress={() => choose(practices[0])}
                >
                  Comenzar 1 minuto <Play size={16} fill="currentColor" />
                </Button>
                <span className="hero-footnote">
                  Puedes ajustar la duración antes de empezar.
                </span>
              </div>
            </section>
            <section className="mood-section reveal">
              <div className="section-heading">
                <h2>¿Qué necesitas hoy?</h2>
              </div>
              <div className="intent-grid">
                {[
                  {
                    text: "Calmarme",
                    icon: Wind,
                    filter: "Calma",
                    tone: "peach",
                  },
                  {
                    text: "Enfocarme",
                    icon: Sun,
                    filter: "Enfoque",
                    tone: "sage",
                  },
                  {
                    text: "Descansar",
                    icon: Moon,
                    filter: "Descanso",
                    tone: "lavender",
                  },
                ].map((item) => (
                  <button
                    className={`intent ${item.tone}`}
                    key={item.text}
                    onClick={() => {
                      setFilter(item.filter);
                      go("practices");
                    }}
                  >
                    <item.icon size={25} strokeWidth={1.5} />
                    <span>{item.text}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="reveal">
              <div className="section-heading">
                <div>
                  <h2>Más prácticas</h2>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    setFilter("Todas");
                    go("practices");
                  }}
                >
                  Ver todas
                </button>
              </div>
              <div className="home-practices">
                {recommendations.map((p) => practiceCard(p, true))}
              </div>
            </section>
          </div>
        )}

        {page === "practices" && (
          <div className="page practices-page">
            <section className="reveal">
              <h1>Prácticas</h1>
              <p>
                Respirar, enfocarte o descansar.
                <br />
                Elige por dónde empezar.
              </p>
            </section>
            <div className="filters reveal" aria-label="Filtrar prácticas">
              {["Todas", "Calma", "Enfoque", "Descanso", "Favoritas"].map(
                (value) => (
                  <button
                    key={value}
                    aria-pressed={filter === value}
                    className={filter === value ? "active" : ""}
                    onClick={() => setFilter(value)}
                  >
                    {value}
                  </button>
                ),
              )}
            </div>
            <div className="practice-grid reveal">
              {practices
                .filter(
                  (p) =>
                    filter === "Todas" ||
                    p.category === filter ||
                    (filter === "Favoritas" &&
                      settings.favorites.includes(p.id)),
                )
                .map((p) => practiceCard(p))}
              {filter === "Favoritas" && settings.favorites.length === 0 && (
                <p className="empty-favorites">
                  Guarda una práctica con la estrella de su panel para
                  encontrarla aquí.
                </p>
              )}
            </div>
          </div>
        )}

        {page === "session" && (
          <div className="session-page">
            <header className="session-header">
              <Button
                isIconOnly
                variant="light"
                radius="full"
                aria-label="Salir de la sesión"
                onPress={leave}
              >
                <ArrowLeft size={22} />
              </Button>
              <span className="wordmark">
                <Flower2 size={23} />
                brisa
              </span>
              <Button
                isIconOnly
                variant="light"
                radius="full"
                aria-label="Ajustes de la sesión"
                onPress={() => {
                  voicePlayer.current?.pause();
                  if (narrating) setIntroPaused(true);
                  setRunning(false);
                  setDrawer("settings");
                }}
              >
                <Settings2 size={21} />
              </Button>
            </header>
            {complete ? (
              <section className="completion reveal">
                <span className="pill">
                  <Check size={14} /> Sesión completada
                </span>
                <Mascot still={quiet} />
                <h1>
                  Gracias por
                  <br />
                  volver a ti.
                </h1>
                <p>
                  Te regalaste {minutes} {minutes === 1 ? "minuto" : "minutos"}{" "}
                  de presencia.
                  <br />
                  ¿Cómo te sientes ahora?
                </p>
                <div className="mood-options">
                  {["Más tranquilo/a", "Igual", "Con incomodidad"].map(
                    (value) => (
                      <button
                        key={value}
                        aria-pressed={mood === value}
                        className={mood === value ? "selected" : ""}
                        onClick={() => setMood(value)}
                      >
                        {value}
                      </button>
                    ),
                  )}
                </div>
                {mood === "Con incomodidad" && (
                  <p role="status">
                    Deja que tu respiración sea natural. Mira a tu alrededor y
                    siente el apoyo de tus pies.
                  </p>
                )}
                <fieldset className="checkin">
                  <legend>
                    ¿Cuánta tensión notas ahora? <span>Opcional</span>
                  </legend>
                  <div className="rating-buttons">
                    {[0, 2, 4, 6, 8, 10].map((value) => (
                      <button
                        key={value}
                        aria-pressed={after === value}
                        onClick={() => setAfter(value)}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  <p>0 = nada de tensión · 10 = mucha tensión</p>
                </fieldset>
                <Button
                  color="primary"
                  radius="lg"
                  className="primary-button"
                  onPress={leave}
                >
                  Volver al inicio <ArrowRight size={18} />
                </Button>
                {storageNote && <p>{storageNote}</p>}
              </section>
            ) : (
              <>
                <div className="session-title">
                  <h1>{selected.name}</h1>
                  <p>{selected.subtitle}</p>
                </div>
                <div className="breathing-stage">
                  <div className="breath-track track-two" />
                  <div className="breath-track track-one" />
                  <div ref={orb} className={`breath-orb ${selected.tone}`}>
                    <Mascot small still={true} />
                  </div>
                </div>
                <div
                  className="phase-copy"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <h2>
                    {narrating
                      ? "Primero, te acompaño"
                      : running
                        ? phase.label
                        : "A tu ritmo"}
                  </h2>
                  <p>
                    {narrating
                      ? "El reloj comenzará cuando termine la voz."
                      : running
                        ? !isBreathing(selected)
                          ? "Respira de forma natural"
                          : "Sin esfuerzo. Sin prisa."
                        : "Continúa cuando te sientas listo/a."}
                  </p>
                </div>
                <div
                  className="session-time"
                  aria-label={`${Math.floor(remaining / 60)} minutos y ${remaining % 60} segundos restantes`}
                >
                  <NumberFlow
                    value={Math.floor(remaining / 60)}
                    format={{ minimumIntegerDigits: 2 }}
                    animated={!quiet}
                  />
                  <span>:</span>
                  <NumberFlow
                    value={remaining % 60}
                    format={{ minimumIntegerDigits: 2 }}
                    digits={{ 1: { max: 5 } }}
                    animated={!quiet}
                  />
                </div>
                <span className="time-label">Tiempo restante</span>
                <div
                  className="session-progress"
                  role="progressbar"
                  aria-label="Progreso de la sesión"
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={elapsed}
                >
                  <div style={{ width: `${(elapsed / total) * 100}%` }} />
                </div>
                <div className="session-controls">
                  <Button
                    isIconOnly
                    variant="light"
                    radius="full"
                    aria-label="Reiniciar sesión"
                    onPress={() => {
                      voicePlayer.current?.pause();
                      setNarrating(false);
                      setIntroPaused(false);
                      if (voicePlayer.current) {
                        voicePlayer.current.onended = null;
                        voicePlayer.current.currentTime = 0;
                      }
                      elapsedRef.current = 0;
                      setElapsed(0);
                      setRunning(false);
                    }}
                  >
                    <RotateCcw size={21} />
                  </Button>
                  <Button
                    color="primary"
                    radius="full"
                    className="pause-button"
                    onPress={() => {
                      if (narrating && voicePlayer.current) {
                        if (voicePlayer.current.paused) {
                          void voicePlayer.current
                            .play()
                            .then(() => setIntroPaused(false))
                            .catch(() =>
                              setAudioError("No se pudo reanudar la guía."),
                            );
                        } else {
                          voicePlayer.current.pause();
                          setIntroPaused(true);
                        }
                        return;
                      }
                      if (!running) void unlockAudio();
                      setRunning(!running);
                    }}
                  >
                    {(narrating ? !introPaused : running) ? (
                      <Pause size={21} />
                    ) : (
                      <Play size={21} />
                    )}{" "}
                    {narrating
                      ? introPaused
                        ? "Continuar guía"
                        : "Pausar guía"
                      : running
                        ? "Pausar"
                        : "Continuar"}
                  </Button>
                  <Button
                    isIconOnly
                    variant="light"
                    radius="full"
                    aria-label={
                      haptics ? "Desactivar vibración" : "Activar vibración"
                    }
                    isDisabled={!hasHaptics}
                    onPress={() => setVibration(!haptics)}
                    className={haptics ? "haptic-active" : ""}
                  >
                    <Vibrate size={22} />
                  </Button>
                </div>
                {narrating && (
                  <button className="end-button" onClick={skipIntro}>
                    Saltar introducción y comenzar
                  </button>
                )}
                <button
                  className="session-audio-button"
                  onClick={() => {
                    voicePlayer.current?.pause();
                    if (narrating) setIntroPaused(true);
                    setRunning(false);
                    setDrawer("settings");
                  }}
                >
                  <Music2 size={17} />
                  {tracks.find((t) => t.id === settings.audio.track)?.name}{" "}
                  <Settings2 size={15} />
                </button>
                {audioError && (
                  <p className="inline-status" role="status">
                    {audioError}
                  </p>
                )}
                <button className="end-button" onClick={leave}>
                  Terminar por ahora
                </button>
                <p className="session-safety">
                  Si algo incomoda, vuelve a respirar naturalmente.
                </p>
                {selected.id !== "ground" && (
                  <button
                    className="grounding-link"
                    onClick={() => {
                      setRunning(false);
                      choose(practices.find((p) => p.id === "ground")!);
                    }}
                  >
                    Esto me incomoda: cambiar a grounding
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </main>
      {page !== "session" && (
        <nav className="bottom-nav" aria-label="Navegación principal">
          <button
            className={page === "home" ? "active" : ""}
            aria-current={page === "home" ? "page" : undefined}
            onClick={() => go("home")}
          >
            <Home size={21} />
            <span>Inicio</span>
          </button>
          <button
            className={page === "practices" ? "active" : ""}
            aria-current={page === "practices" ? "page" : undefined}
            onClick={() => go("practices")}
          >
            <Flower2 size={22} />
            <span>Prácticas</span>
          </button>
          <button onClick={() => setDrawer("space")}>
            <Heart size={21} />
            <span>Mi espacio</span>
          </button>
        </nav>
      )}

      <Drawer.Root
        open={drawer !== null}
        onOpenChange={(open) => {
          if (!open) setDrawer(null);
        }}
        autoFocus
        handleOnly
      >
        <Drawer.Portal>
          <Drawer.Overlay className="drawer-overlay" />
          <Drawer.Content className="drawer-content">
            <Drawer.Handle
              className="drawer-handle"
              preventCycle
              aria-label="Arrastrar para cerrar"
            />
            <Button
              isIconOnly
              radius="full"
              variant="light"
              className="drawer-close"
              aria-label="Cerrar panel"
              onPress={() => setDrawer(null)}
            >
              <X size={21} />
            </Button>
            <div className="drawer-scroll" data-vaul-no-drag>
              {drawer === "practice" && (
                <>
                  <span className={`drawer-art ${selected.tone}`}>
                    {(() => {
                      const Icon = icons[selected.icon];
                      return <Icon size={30} strokeWidth={1.5} />;
                    })()}
                  </span>
                  <span className="technique-label">{selected.subtitle}</span>
                  <Drawer.Title>{selected.name}</Drawer.Title>
                  <Drawer.Description>
                    {selected.instruction}
                  </Drawer.Description>
                  <button
                    className="favorite-button"
                    aria-pressed={settings.favorites.includes(selected.id)}
                    onClick={toggleFavorite}
                  >
                    <Star
                      size={17}
                      fill={
                        settings.favorites.includes(selected.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                    {settings.favorites.includes(selected.id)
                      ? "Guardada en favoritas"
                      : "Guardar práctica"}
                  </button>
                  <div className="duration-heading">
                    <Clock3 size={16} />
                    <strong>¿Cuánto tiempo tienes?</strong>
                  </div>
                  <div className="duration-options">
                    {[1, 2, 3, 5, 10].map((value) => (
                      <button
                        key={value}
                        className={minutes === value ? "selected" : ""}
                        aria-pressed={minutes === value}
                        onClick={() => setMinutes(value)}
                      >
                        {value} min {minutes === value && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                  {isBreathing(selected) &&
                    selected.phases.some((p) =>
                      p.label.startsWith("Pausa"),
                    ) && (
                      <div className="preference-row">
                        <div>
                          <strong>Omitir retenciones</strong>
                          <span>Conserva inhalación y exhalación</span>
                        </div>
                        <Switch
                          aria-label="Omitir retenciones"
                          isSelected={noHolds}
                          onValueChange={setNoHolds}
                        />
                      </div>
                    )}
                  <fieldset className="checkin">
                    <legend>
                      ¿Cuánta tensión notas? <span>Opcional</span>
                    </legend>
                    <div className="rating-buttons">
                      {[0, 2, 4, 6, 8, 10].map((value) => (
                        <button
                          key={value}
                          aria-pressed={before === value}
                          onClick={() => setBefore(value)}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    <p>0 = nada · 10 = mucha tensión</p>
                  </fieldset>
                  <details className="sound-details">
                    <summary>
                      <Music2 size={17} /> Música y respiración
                    </summary>
                    {audioPanel()}
                  </details>
                  <div className="preference-row">
                    <div>
                      <strong>Guía con vibración</strong>
                      <span>
                        {hasHaptics
                          ? "Pulsos suaves entre cada etapa"
                          : "No disponible en este navegador"}
                      </span>
                    </div>
                    <Switch
                      aria-label="Guía con vibración"
                      isSelected={haptics}
                      isDisabled={!hasHaptics}
                      onValueChange={setVibration}
                      color="primary"
                    />
                  </div>
                  <p className="safety-note">
                    Respira cómodamente. Si notas mareo o más ansiedad, detente
                    y vuelve a tu respiración natural.
                  </p>
                  <Button
                    color="primary"
                    radius="lg"
                    className="primary-button"
                    onPress={start}
                  >
                    <Play size={18} fill="currentColor" /> Comenzar mi pausa
                  </Button>
                  <p className="drawer-footnote">
                    Guía visual{settings.audio.breath ? " y sonora" : ""}
                    {settings.audio.track !== "off" ? " con música" : ""}
                  </p>
                </>
              )}
              {drawer === "settings" && (
                <>
                  <Drawer.Title>Tu forma de estar.</Drawer.Title>
                  <Drawer.Description>
                    Pequeños ajustes para sentirte a gusto.
                  </Drawer.Description>
                  <div className="preference-row">
                    <div>
                      <strong>Vibración suave</strong>
                      <span>
                        {hasHaptics
                          ? "Acompaña las etapas de la práctica"
                          : "Este navegador no admite vibración"}
                      </span>
                    </div>
                    <Switch
                      aria-label="Vibración suave"
                      isDisabled={!hasHaptics}
                      isSelected={haptics}
                      onValueChange={setVibration}
                    />
                  </div>
                  <div className="preference-row">
                    <div>
                      <strong>Modo oscuro</strong>
                      <span>Tonos cálidos para descansar la vista</span>
                    </div>
                    <Switch
                      aria-label="Modo oscuro"
                      isSelected={settings.dark}
                      onValueChange={(dark) => setSettings((s) => ({ ...s, dark }))}
                    />
                  </div>
                  <div className="preference-row">
                    <div>
                      <strong>Menos movimiento</strong>
                      <span>
                        {systemReduced
                          ? "Activado por tu dispositivo"
                          : "Una experiencia visual más quieta"}
                      </span>
                    </div>
                    <Switch
                      aria-label="Menos movimiento"
                      isSelected={quiet}
                      isDisabled={systemReduced}
                      onValueChange={setReduced}
                    />
                  </div>
                  {audioPanel()}
                  <div className="offline-actions">
                    <button
                      className="secondary-action"
                      disabled={downloading}
                      onClick={() => void cacheMusic()}
                    >
                      <Download size={16} />
                      {downloading
                        ? "Descargando…"
                        : "Guardar música sin conexión"}
                    </button>
                    <p className="small-copy">
                      Cuatro grabaciones, aproximadamente 18 MB. La app sin
                      conexión se activa en la versión de producción después de
                      abrirla una vez.
                    </p>
                    {downloadStatus && (
                      <p className="inline-status" role="status">
                        {downloadStatus}
                      </p>
                    )}
                  </div>
                  <details className="sound-details">
                    <summary>Guía de voz de {selected.subtitle}</summary>
                    <p className="small-copy">
                      {narrator.description}. Narración de <a href="https://elevenlabs.io" target="_blank" rel="noreferrer">{narrator.provider}</a>{" "}
                      incluida en la app. El reloj de la práctica comienza al
                      terminar la introducción.
                    </p>
                    {!guide?.available && (
                      <p className="inline-status">
                        El guion está listo. La grabación de ElevenLabs todavía
                        está pendiente de generación.
                      </p>
                    )}
                    <details className="sound-details">
                      <summary>Leer introducción</summary>
                      <p className="small-copy">
                        {scriptTexts[selected.id] ||
                          "La introducción se está cargando."}
                      </p>
                    </details>
                    {guide?.available && (
                      <>
                        <div className="preference-row">
                          <strong>Reproducir guía</strong>
                          <Switch
                            aria-label="Reproducir guía de voz"
                            isSelected={settings.voice}
                            onValueChange={(voice) =>
                              setSettings((s) => ({ ...s, voice }))
                            }
                          />
                        </div>
                        <label className="volume-label">
                          Volumen de voz
                          <input
                            aria-label="Volumen de voz"
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={settings.voiceVolume}
                            onChange={(e) =>
                              setSettings((s) => ({
                                ...s,
                                voiceVolume: Number(e.target.value),
                              }))
                            }
                          />
                        </label>
                      </>
                    )}
                  </details>
                  {audioError && (
                    <p className="inline-status" role="status">
                      {audioError}
                    </p>
                  )}
                  <button
                    className="text-button"
                    onClick={() => setDrawer("science")}
                  >
                    <BookOpen size={17} /> Prácticas y evidencia
                  </button>
                  <Button
                    color="primary"
                    radius="lg"
                    className="primary-button"
                    onPress={() => setDrawer(null)}
                  >
                    Listo <Check size={18} />
                  </Button>
                </>
              )}
              {drawer === "space" && (
                <>
                  <Drawer.Title>Tu pequeño espacio.</Drawer.Title>
                  <Drawer.Description>
                    Cada pausa cuenta. También las más pequeñas.
                  </Drawer.Description>
                  <div className="stats">
                    <div>
                      <strong>{history.length}</strong>
                      <span>pausas completadas</span>
                    </div>
                    <div>
                      <strong>
                        {history.reduce((sum, item) => sum + item.minutes, 0)}
                      </strong>
                      <span>minutos para ti</span>
                    </div>
                  </div>
                  <section className="progress-section">
                    <h3>Tu objetivo semanal</h3>
                    <div className="duration-options">
                      {[3, 5, 7].map((goal) => (
                        <button
                          key={goal}
                          aria-pressed={settings.goal === goal}
                          className={settings.goal === goal ? "selected" : ""}
                          onClick={() => setSettings((s) => ({ ...s, goal }))}
                        >
                          {goal} días
                        </button>
                      ))}
                    </div>
                    <p className="small-copy">
                      Esta semana practicaste {weekCount} días. No hay rachas
                      que perder.
                    </p>
                    <div className="mini-calendar">
                      {week.map((date, i) => (
                        <div
                          key={date}
                          className={activeDays.has(date) ? "done" : ""}
                        >
                          <span>{["L", "M", "M", "J", "V", "S", "D"][i]}</span>
                          <strong>
                            {activeDays.has(date) ? (
                              <Check size={15} />
                            ) : (
                              Number(date.slice(-2))
                            )}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </section>
                  {paired.length > 0 && (
                    <section className="progress-section">
                      <h3>Tu tensión antes y después</h3>
                      <div className="checkin-averages">
                        <span>
                          Antes <strong>{averageBefore.toFixed(1)}/10</strong>
                        </span>
                        <span>
                          Después <strong>{averageAfter.toFixed(1)}/10</strong>
                        </span>
                      </div>
                      <p className="small-copy">
                        Promedio de {paired.length}{" "}
                        {paired.length === 1
                          ? "sesión con ambos registros"
                          : "sesiones con ambos registros"}
                        . Es una observación personal, no una medida clínica ni
                        una prueba de eficacia.
                      </p>
                    </section>
                  )}
                  <details className="sound-details">
                    <summary>
                      <Bell size={17} /> Recordar mi pausa
                    </summary>
                    <div className="preference-row">
                      <div>
                        <strong>Recordatorio al abrir Brisa</strong>
                        <span>
                          Se muestra al volver después de la hora elegida
                        </span>
                      </div>
                      <Switch
                        aria-label="Activar recordatorio"
                        isSelected={settings.reminderEnabled}
                        onValueChange={(reminderEnabled) =>
                          setSettings((s) => ({ ...s, reminderEnabled }))
                        }
                      />
                    </div>
                    <label className="time-input">
                      Hora local
                      <input
                        type="time"
                        aria-label="Hora del recordatorio"
                        value={settings.reminder}
                        onChange={(e) => {
                          if (e.target.value)
                            setSettings((s) => ({
                              ...s,
                              reminder: e.target.value,
                            }));
                        }}
                      />
                    </label>
                    <button
                      className="secondary-action"
                      onClick={() =>
                        downloadFile(
                          "mi-pausa-brisa.ics",
                          calendarFile(settings.reminder),
                          "text/calendar",
                        )
                      }
                    >
                      <Download size={16} /> Añadir recordatorio diario al
                      calendario
                    </button>
                    <p className="small-copy">
                      Importa el archivo en tu calendario para recibir avisos
                      incluso con Brisa cerrada. Los avisos dependen de los
                      ajustes de tu calendario.
                    </p>
                  </details>
                  <h3 className="history-title">Tus pausas recientes</h3>
                  {history.length === 0 ? (
                    <div className="empty-history">
                      <Mascot small still={quiet} />
                      <p>Tu primera pausa puede empezar hoy.</p>
                    </div>
                  ) : (
                    <div className="history-list">
                      {history.slice(0, 5).map((entry, i) => (
                        <div key={`${entry.date}-${i}`}>
                          <span>
                            <strong>{entry.name}</strong>
                            <small>
                              {new Date(entry.date).toLocaleDateString(
                                "es-PE",
                                {
                                  day: "numeric",
                                  month: "short",
                                },
                              )}
                            </small>
                          </span>
                          <span>{entry.minutes} min</span>
                          {entry.before !== undefined &&
                            entry.after !== undefined && (
                              <small className="checkin-result">
                                Tensión {entry.before} → {entry.after}
                              </small>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="drawer-footnote">
                    Tu historial se guarda solo en este navegador.
                  </p>
                  <div className="privacy-actions">
                    <button
                      onClick={() =>
                        downloadFile(
                          "brisa-mis-datos.json",
                          JSON.stringify({ history, settings }, null, 2),
                          "application/json",
                        )
                      }
                    >
                      <Download size={16} /> Exportar mis datos
                    </button>
                    <button onClick={() => setDeleteConfirm(true)}>
                      <Trash2 size={16} /> Borrar mis datos
                    </button>
                  </div>
                  {deleteConfirm && (
                    <div className="delete-confirm" role="alert">
                      <p>
                        Se borrarán historial, preferencias y cualquier audio
                        importado en versiones anteriores. Esta acción no se
                        puede deshacer.
                      </p>
                      <button
                        onClick={async () => {
                          try {
                            await clearLegacyVoiceData();
                            localStorage.removeItem("brisa-reminder-day");
                            setHistory([]);
                            setSettings(defaults);
                            voicePlayer.current?.pause();
                            voicePlayer.current = null;
                            setDeleteConfirm(false);
                            setAudioError("");
                          } catch {
                            setStorageNote(
                              "No se pudieron borrar todos los datos. Inténtalo de nuevo.",
                            );
                          }
                        }}
                      >
                        Sí, borrar datos
                      </button>
                      <button onClick={() => setDeleteConfirm(false)}>
                        Cancelar
                      </button>
                    </div>
                  )}
                  {storageNote && (
                    <p role="status" className="inline-status">
                      {storageNote}
                    </p>
                  )}
                  <Button
                    color="primary"
                    radius="lg"
                    className="primary-button"
                    onPress={() => {
                      setDrawer(null);
                      go("practices");
                    }}
                  >
                    Encontrar una práctica <ChevronRight size={18} />
                  </Button>
                </>
              )}
              {drawer === "science" && (
                <>
                  <Drawer.Title>Prácticas con contexto</Drawer.Title>
                  <Drawer.Description>
                    Herramientas de bienestar para adultos. Cada persona puede
                    responder de forma distinta.
                  </Drawer.Description>
                  <div className="science-content">
                    <h3>Qué respalda la investigación</h3>
                    <p>
                      Mindfulness y las técnicas de relajación pueden ayudar con
                      síntomas de estrés y ansiedad. La calidad y el alcance de
                      la evidencia varían; esta app no diagnostica ni reemplaza
                      atención profesional.
                    </p>
                    <a
                      href="https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Mindfulness: eficacia y seguridad · NCCIH
                    </a>
                    <a
                      href="https://www.nccih.nih.gov/health/relaxation-techniques-what-you-need-to-know"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Respiración y relajación muscular · NCCIH
                    </a>
                    <h3>Suspiro cíclico</h3>
                    <p>
                      Balban et al. (2023) estudiaron cinco minutos diarios
                      durante un mes. Las sesiones breves de Brisa son
                      adaptaciones, no una reproducción de ese protocolo.
                    </p>
                    <a
                      href="https://doi.org/10.1016/j.xcrm.2022.100895"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Leer el estudio original
                    </a>
                    <h3>4–7–8 y grounding</h3>
                    <p>
                      La evidencia específica es más limitada. Las retenciones
                      son opcionales y el grounding se ofrece como orientación
                      al entorno, no como tratamiento de una crisis.
                    </p>
                    <h3>Cuida tu comodidad</h3>
                    <p>
                      Practica sentado/a o en un lugar seguro, nunca al conducir
                      ni dentro del agua. Si aparece mareo o más malestar,
                      vuelve a respirar naturalmente y detén la práctica. Para
                      síntomas persistentes o intensos, busca apoyo profesional;
                      ante peligro inmediato, contacta a los servicios de
                      emergencia de tu localidad.
                    </p>
                    <h3>Música y créditos</h3>
                    {tracks
                      .filter((t) => t.id !== "off")
                      .map((t) => (
                        <a
                          key={t.id}
                          href={t.source}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t.name} — {t.author} · CC0
                        </a>
                      ))}
                    <p>
                      El audio de fondo es opcional. Elige silencio si te ayuda
                      a concentrarte.
                    </p>
                  </div>
                  <button
                    className="secondary-action"
                    onClick={() => setDrawer("settings")}
                  >
                    Volver a ajustes
                  </button>
                </>
              )}
            </div>
            <span className="swipe-hint">
              <ArrowDown size={12} /> Desliza para cerrar
            </span>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
