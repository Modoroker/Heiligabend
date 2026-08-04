// Utility to calculate dynamic background gradient based on hour of day

export function getTimeOfDayTheme(dateInput) {
  const date = dateInput ? new Date(dateInput) : new Date();
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return {
      period: 'morning',
      label: 'Morgensonne 🌅',
      gradientClass: 'bg-gradient-to-b from-amber-950/60 via-midnight-900 to-rose-950/50',
      accentColor: 'text-amber-300',
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      period: 'day',
      label: 'Tagesschein ☀️',
      gradientClass: 'bg-gradient-to-b from-slate-900 via-midnight-900 to-indigo-950/40',
      accentColor: 'text-champagne-300',
    };
  } else if (hour >= 18 && hour < 22) {
    return {
      period: 'evening',
      label: 'Abendrot 🌆',
      gradientClass: 'bg-gradient-to-b from-rose-950/70 via-midnight-900 to-purple-950/70',
      accentColor: 'text-rosegold-300',
    };
  } else {
    return {
      period: 'night',
      label: 'Sternennacht 🌙',
      gradientClass: 'bg-gradient-to-b from-midnight-950 via-midnight-900 to-slate-950',
      accentColor: 'text-indigo-300',
    };
  }
}
