type TimeOfDay = "morning" | "afternoon" | "evening";

export function getTimeOfDay(): TimeOfDay {
  const hours = new Date().getHours();
  if (hours < 12) return "morning";
  if (hours < 18) return "afternoon";
  return "evening";
}

const TIME_OF_DAY_MESSAGES: Record<TimeOfDay, string[]> = {
  morning: [
    "Good morning, {{name}}",
    "Good morning my love!",
    "Good morning, {{name}}!",
    "Morning, {{name}}!",
    "Morning love",
    "Rise and shine, {{name}}!",
  ],
  afternoon: [
    "Good afternoon, {{name}}",
    "Good afternoon love!",
    "Good afternoon, {{name}}!",
    "Afternoon, {{name}}!",
    "Afternoon love",
  ],
  evening: [
    "Good evening, {{name}}",
    "Good evening, love",
    "Good evening, {{name}}!",
    "Evening, {{name}}!",
    "Evening love",
  ],
};

const TIME_OF_DAY_FOLLOWUP_MESSAGES: Record<TimeOfDay, string[]> = {
  morning: [
    "You're doing great, keep it up!",
    "Keep it up!",
    "I'm always proud of you.",
    "What's cookin?",
    "How's your day going?",
    "Squeeze in some breakfast!",
  ],
  afternoon: [
    "Don't forget to eat lunch!",
    "You're doing great, keep it up!",
    "Keep it up love!",
    "What's cookin?",
    "How's your day going?",
  ],
  evening: [
    "What's for dinner?",
    "I'm always so proud of you.",
    "Good night!",
    "Long day?",
    "I hope you had a lovely day today.",
  ],
};

export const getFollowUpMessage = (timeOfDay: TimeOfDay) => {
  return TIME_OF_DAY_FOLLOWUP_MESSAGES[timeOfDay][
    Math.floor(Math.random() * TIME_OF_DAY_FOLLOWUP_MESSAGES[timeOfDay].length)
  ];
};

export const getTimeOfDayMessage = (timeOfDay: TimeOfDay, name: string) => {
  return TIME_OF_DAY_MESSAGES[timeOfDay][
    Math.floor(Math.random() * TIME_OF_DAY_MESSAGES[timeOfDay].length)
  ].replaceAll("{{name}}", name);
};
