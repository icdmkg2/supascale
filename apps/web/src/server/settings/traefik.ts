import { getSetting } from "@/lib/settings-store";

export function resolveTraefikSettings() {
  return {
    traefikNetwork: getSetting("traefik_network") ?? "traefik_net",
    entrypoint: getSetting("traefik_entrypoint") ?? "web",
    websecureEntrypoint: getSetting("traefik_entrypoint_websecure") ?? "websecure",
    certResolver: getSetting("traefik_cert_resolver") ?? null,
  };
}
