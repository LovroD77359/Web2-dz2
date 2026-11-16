import type { Config } from "@react-router/dev/config";

const fromEnv = process.env.ALLOWED_ACTION_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean);
const renderHost = process.env.RENDER_EXTERNAL_HOSTNAME;

export default {
  ssr: true,
  allowedActionOrigins: fromEnv?.length ? fromEnv : renderHost ? [renderHost] : ["*.onrender.com"],
} satisfies Config;
