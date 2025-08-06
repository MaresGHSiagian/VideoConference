// Avatar utilities for consistent avatar generation across components

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const getAvatarGradient = (name: string): string => {
  // Generate consistent gradient based on name
  const colors = [
    "#3b82f6, #9333ea", // blue to purple
    "#10b981, #0d9488", // green to teal
    "#a855f7, #ec4899", // purple to pink
    "#f97316, #dc2626", // orange to red
    "#6366f1, #3b82f6", // indigo to blue
    "#ec4899, #f43f5e", // pink to rose
    "#14b8a6, #06b6d4", // teal to cyan
    "#eab308, #f97316", // yellow to orange
    "#059669, #10b981", // emerald to green
    "#8b5cf6, #a855f7", // violet to purple
  ];

  // Use name hash to consistently pick gradient
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export const getAvatarColor = (name: string): string => {
  // Single color version for smaller avatars
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-indigo-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-yellow-500",
    "bg-emerald-500",
    "bg-violet-500",
  ];

  // Use name hash to consistently pick color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
