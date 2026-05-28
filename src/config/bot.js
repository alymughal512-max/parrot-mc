// ==========================================
// STANDARD CONFIGURATION EXPORT
// ==========================================
export const botConfig = {
  autoReactions: {
    enabled: true,
    triggers: {
      upi: "💸",
      ip: "🌐",
      ping: "🏓",
      help: "👀",
    },
  },
  kingReaction: {
    enabled: true,
    userId: "YOUR_DISCORD_USER_ID_HERE", // <-- Yahan apni asli Discord User ID paste karein
    emoji: "👑",
  },
  stickyMessages: {
    enabled: true,
    defaultMessage: "📌 Please follow the server rules and enjoy your stay!",
    repeatAfterMessages: 5,
  },
  channels: {
    welcome: "WELCOME_CHANNEL_ID_HERE",  // <-- Welcome channel ki ID daalein
    logs: "LOGS_CHANNEL_ID_HERE",        // <-- Server Logs channel ki ID daalein
    ticketCategory: "CATEGORY_ID_HERE",  // <-- Jis category ke andar tickets khulein
  },
  roles: {
    verified: "VERIFIED_ROLE_ID_HERE",    // <-- Verified role ki ID
    staff: "STAFF_ROLE_ID_HERE",          // <-- Staff/Admin role ki ID
  }
};

export default botConfig;
