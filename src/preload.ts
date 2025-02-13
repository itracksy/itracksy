import exposeContexts from "./helpers/ipc/context-exposer";
import { exposeElectronTRPC } from "electron-trpc/main";

process.once("loaded", async () => {
  exposeElectronTRPC();
});
exposeContexts();
