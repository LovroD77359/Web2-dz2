import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("transfer", "routes/transfer.ts"), // bank transfer route - used by CSRF section
  route("attacker", "routes/attacker.ts"), // CSRF attackers page
] satisfies RouteConfig;
