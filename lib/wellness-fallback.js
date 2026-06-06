const TIPS = {
  low: [
    {
      icon: '🌬️',
      title: '4-7-8 Breathing',
      description: 'Inhale for 4 counts, hold for 7, exhale for 8. Repeat 4 times. This activates your parasympathetic nervous system and reduces anxiety fast.',
      action: 'Try it now — set a 2-minute timer and breathe.',
    },
    {
      icon: '💙',
      title: 'Self-Compassion Pause',
      description: "You're going through something hard. Acknowledge it — don't suppress it. Tell yourself: \"This is difficult. Many students feel this way. I'm doing my best.\"",
      action: 'Write one kind thing you would say to a friend in your situation.',
    },
    {
      icon: '📞',
      title: 'You Don\'t Have to Go It Alone',
      description: "If stress feels overwhelming, iCall (9152987821) offers free mental health support for students across India.",
      action: 'Save the number. Reaching out is a sign of strength.',
    },
  ],
  medium: [
    {
      icon: '⏸️',
      title: 'The 5-Minute Study Break',
      description: 'Stand up, stretch your arms, roll your shoulders, and look at something 20 feet away for 20 seconds. Your brain needs these micro-resets to retain information.',
      action: 'Set a timer for 5 minutes and step away from your desk.',
    },
    {
      icon: '✍️',
      title: 'Brain Dump',
      description: 'Write everything on your mind — worries, tasks, random thoughts — for 5 minutes without stopping. Getting it out of your head clears mental space.',
      action: 'Open your journal and write without filtering.',
    },
    {
      icon: '🌟',
      title: 'Progress Affirmation',
      description: "Your past self worked hard to get here. Every topic you've studied is a step forward. Progress, not perfection.",
      action: 'List 3 things you have already prepared well.',
    },
  ],
  high: [
    {
      icon: '🎯',
      title: 'Set Tomorrow\'s One Goal',
      description: "When you're feeling good, momentum matters. Identify the single most important thing to accomplish tomorrow and write it down tonight.",
      action: 'Write your top priority for tomorrow before you sleep.',
    },
    {
      icon: '🙏',
      title: 'Gratitude Practice',
      description: "Gratitude rewires the brain toward positive thinking. Even during exam stress, finding 3 things you are grateful for boosts resilience.",
      action: 'Write 3 specific things you are grateful for today.',
    },
    {
      icon: '💪',
      title: 'Momentum Builder',
      description: "You are doing great. Use this energy to tackle one challenging topic you have been avoiding. Start with just 10 minutes.",
      action: 'Pick one hard topic and spend the next 10 minutes on it.',
    },
  ],
}

export function getFallbackTips(avgMoodScore) {
  if (avgMoodScore <= 2) return TIPS.low
  if (avgMoodScore <= 3.5) return TIPS.medium
  return TIPS.high
}
