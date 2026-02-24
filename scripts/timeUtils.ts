// src/utils/dateUtils.ts
export const getTimeLabel = (timestamp?: number) => {
  if (!timestamp) return "UPCOMING";
  const now = new Date();
  const eventDate = new Date(timestamp * 1000);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate(),
  );

  const diffDays =
    (eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays === 0) return eventDate.getHours() >= 17 ? "TONIGHT" : "TODAY";
  if (diffDays === 1) return "TOMORROW";
  if (diffDays > 1 && diffDays < 7) {
    const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return weekdays[eventDay.getDay()];
  }

  const monthNames = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  return `${eventDay.getDate()} ${monthNames[eventDay.getMonth()]}`;
};

export const formatEventTime = (timestamp?: number) => {
  if (!timestamp) return "";
  const eventDate = new Date(timestamp * 1000);
  const hours = eventDate.getHours().toString().padStart(2, "0");
  const minutes = eventDate.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};
