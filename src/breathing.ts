export type Phase = {
  label: string;
  seconds: number;
  scale: number;
  haptic: number | number[];
};
export type Practice = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: "Calma" | "Enfoque" | "Descanso";
  minutes: number;
  tone: string;
  icon: "sun" | "square" | "moon" | "leaf";
  phases: Phase[];
  instruction: string;
};
export const practices: Practice[] = [
  {
    id: "sigh",
    name: "Un suspiro de calma",
    subtitle: "Suspiro cíclico",
    description:
      "Dos inhalaciones suaves. Una exhalación larga. Un pequeño espacio para ti.",
    category: "Calma",
    minutes: 1,
    tone: "peach",
    icon: "sun",
    instruction:
      "Inhala cómodamente por la nariz, añade un poquito de aire y exhala despacio. Sigue un ritmo que te resulte agradable.",
    phases: [
      { label: "Inhala suave", seconds: 3, scale: 1.12, haptic: 70 },
      {
        label: "Un poquito más",
        seconds: 1,
        scale: 1.22,
        haptic: [40, 70, 40],
      },
      { label: "Exhala despacio", seconds: 6, scale: 0.84, haptic: 140 },
    ],
  },
  {
    id: "box",
    name: "Encuentra tu centro",
    subtitle: "Respiración en caja",
    description:
      "Un ritmo equilibrado para hacer una pausa y volver al presente.",
    category: "Enfoque",
    minutes: 2,
    tone: "sage",
    icon: "square",
    instruction:
      "Inhala, haz una pausa, exhala y vuelve a pausar: cuatro segundos por etapa. Si retener el aire te incomoda, elige Un respiro lento.",
    phases: [
      { label: "Inhala suave", seconds: 4, scale: 1.2, haptic: 70 },
      { label: "Pausa cómoda", seconds: 4, scale: 1.2, haptic: 40 },
      { label: "Exhala despacio", seconds: 4, scale: 0.84, haptic: 140 },
      { label: "Pausa cómoda", seconds: 4, scale: 0.84, haptic: 40 },
    ],
  },
  {
    id: "slow",
    name: "Un respiro lento",
    subtitle: "Exhalación prolongada",
    description: "Suelta el día con una respiración suave y sin retenciones.",
    category: "Descanso",
    minutes: 3,
    tone: "lavender",
    icon: "moon",
    instruction:
      "Inhala suavemente durante cuatro segundos y exhala durante seis. Respira con comodidad; puedes volver a tu ritmo natural cuando quieras.",
    phases: [
      { label: "Inhala suave", seconds: 4, scale: 1.2, haptic: 70 },
      { label: "Exhala despacio", seconds: 6, scale: 0.84, haptic: 140 },
    ],
  },
  {
    id: "body",
    name: "Vuelve a tu cuerpo",
    subtitle: "Escaneo corporal",
    description: "Recorre tus sensaciones con curiosidad, a tu propio ritmo.",
    category: "Calma",
    minutes: 3,
    tone: "sand",
    icon: "leaf",
    instruction:
      "Deja que la respiración siga su ritmo natural. Lleva tu atención a cada zona indicada, sin intentar cambiar lo que sientes. Puedes mantener los ojos abiertos.",
    phases: [
      { label: "Siente tus pies", seconds: 30, scale: 1, haptic: 50 },
      { label: "Nota tus piernas", seconds: 30, scale: 1, haptic: 50 },
      { label: "Observa tu abdomen", seconds: 30, scale: 1, haptic: 50 },
      { label: "Suelta tus hombros", seconds: 30, scale: 1, haptic: 50 },
      { label: "Relaja tu rostro", seconds: 30, scale: 1, haptic: 50 },
      { label: "Siente todo tu cuerpo", seconds: 30, scale: 1, haptic: 50 },
    ],
  },
];
practices.push(
  {
    id: "478",
    name: "Una noche tranquila",
    subtitle: "Respiración 4–7–8",
    description:
      "Una práctica opcional con pausas. Elige la alternativa sin retención si te resulta incómoda.",
    category: "Descanso",
    minutes: 1,
    tone: "lavender",
    icon: "moon",
    instruction:
      "Inhala durante cuatro segundos, pausa durante siete y exhala durante ocho. No fuerces el aire ni las pausas. Empieza con una sesión breve. Si te incomoda, elige Un respiro lento. La evidencia específica de esta técnica es limitada.",
    phases: [
      { label: "Inhala suave", seconds: 4, scale: 1.2, haptic: 70 },
      { label: "Pausa cómoda", seconds: 7, scale: 1.2, haptic: 40 },
      { label: "Exhala despacio", seconds: 8, scale: 0.84, haptic: 140 },
    ],
  },
  {
    id: "ground",
    name: "Aquí y ahora",
    subtitle: "Grounding sensorial",
    description:
      "Vuelve a tu entorno con los ojos abiertos. No necesitas cambiar tu respiración.",
    category: "Calma",
    minutes: 1,
    tone: "sand",
    icon: "leaf",
    instruction:
      "Mira a tu alrededor. Nombra cinco cosas que ves, cuatro que sientes con el tacto y tres sonidos. Después nota dos olores y un sabor; si no percibes alguno, recuerda uno familiar. Respira naturalmente.",
    phases: [
      { label: "Mira cinco cosas", seconds: 15, scale: 1, haptic: 50 },
      { label: "Siente cuatro texturas", seconds: 15, scale: 1, haptic: 50 },
      { label: "Escucha tres sonidos", seconds: 12, scale: 1, haptic: 50 },
      { label: "Nota dos olores", seconds: 10, scale: 1, haptic: 50 },
      { label: "Nota un sabor", seconds: 8, scale: 1, haptic: 50 },
    ],
  },
  {
    id: "muscle",
    name: "Suelta la tensión",
    subtitle: "Relajación muscular",
    description:
      "Tensa con suavidad y suelta. Evita cualquier zona dolorida o lesionada.",
    category: "Calma",
    minutes: 3,
    tone: "peach",
    icon: "leaf",
    instruction:
      "Respira naturalmente. Tensa cada zona suavemente unos segundos, sin dolor ni retener el aire, y luego suéltala. Puedes saltar cualquier movimiento que incomode.",
    phases: [
      { label: "Aprieta suave las manos", seconds: 5, scale: 1, haptic: 50 },
      { label: "Suelta las manos", seconds: 25, scale: 1, haptic: 80 },
      { label: "Tensa suave los brazos", seconds: 5, scale: 1, haptic: 50 },
      { label: "Suelta los brazos", seconds: 25, scale: 1, haptic: 80 },
      { label: "Eleva suave los hombros", seconds: 5, scale: 1, haptic: 50 },
      { label: "Deja caer los hombros", seconds: 25, scale: 1, haptic: 80 },
      { label: "Tensa suave las piernas", seconds: 5, scale: 1, haptic: 50 },
      { label: "Suelta las piernas", seconds: 25, scale: 1, haptic: 80 },
      { label: "Tensa suave los pies", seconds: 5, scale: 1, haptic: 50 },
      { label: "Suelta los pies", seconds: 25, scale: 1, haptic: 80 },
      { label: "Descansa todo el cuerpo", seconds: 30, scale: 1, haptic: 50 },
    ],
  },
  {
    id: "mindful",
    name: "Solo estar",
    subtitle: "Atención plena",
    description:
      "Observa la respiración tal como es. Cuando te distraigas, vuelve con amabilidad.",
    category: "Enfoque",
    minutes: 5,
    tone: "sage",
    icon: "sun",
    instruction:
      "Elige una postura cómoda. Nota el contacto del cuerpo con el asiento o el suelo. Observa tu respiración sin controlarla. Distraerse es normal: nota lo que pasó y vuelve, sin juzgarte.",
    phases: [
      {
        label: "Siente el apoyo del cuerpo",
        seconds: 30,
        scale: 1,
        haptic: 50,
      },
      { label: "Observa tu respiración", seconds: 60, scale: 1, haptic: 50 },
      { label: "Vuelve con amabilidad", seconds: 60, scale: 1, haptic: 50 },
      { label: "Escucha los sonidos", seconds: 60, scale: 1, haptic: 50 },
      {
        label: "Deja espacio a lo que sientes",
        seconds: 60,
        scale: 1,
        haptic: 50,
      },
      { label: "Nota este momento", seconds: 30, scale: 1, haptic: 50 },
    ],
  },
  {
    id: "kind",
    name: "Un poco de amabilidad",
    subtitle: "Autocompasión breve",
    description:
      "Un momento para hablarte con el cuidado que ofrecerías a alguien querido.",
    category: "Calma",
    minutes: 3,
    tone: "peach",
    icon: "sun",
    instruction:
      "Respira de forma natural. Si te resulta agradable, apoya una mano en el pecho. Reconoce lo que sientes y prueba estas frases, sin obligarte a creerlas ni sentir algo distinto.",
    phases: [
      { label: "Reconoce cómo te sientes", seconds: 45, scale: 1, haptic: 50 },
      { label: "Esto puede ser difícil", seconds: 45, scale: 1, haptic: 50 },
      {
        label: "No tienes que poder con todo",
        seconds: 45,
        scale: 1,
        haptic: 50,
      },
      {
        label: "Puedo tratarme con cuidado",
        seconds: 45,
        scale: 1,
        haptic: 50,
      },
    ],
  },
);
export function isBreathing(practice: Practice) {
  return practice.phases.some((phase) => phase.scale !== 1);
}
export function withoutHolds(practice: Practice): Practice {
  return {
    ...practice,
    phases: practice.phases.filter((phase) => !phase.label.startsWith("Pausa")),
  };
}
export function phaseAt(practice: Practice, elapsedSeconds: number) {
  const length = practice.phases.reduce((sum, phase) => sum + phase.seconds, 0);
  let position = Math.max(0, elapsedSeconds) % length;
  for (let index = 0; index < practice.phases.length; index++) {
    const phase = practice.phases[index];
    if (position < phase.seconds)
      return { ...phase, index, remaining: phase.seconds - position };
    position -= phase.seconds;
  }
  return {
    ...practice.phases[0],
    index: 0,
    remaining: practice.phases[0].seconds,
  };
}
