import { AppRouter } from "@/api";
import { createTRPCProxyClient } from "@trpc/client";
import { ipcLink } from "electron-trpc/renderer";

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [ipcLink()],
});
