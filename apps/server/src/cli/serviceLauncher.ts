import * as Effect from "effect/Effect";
import { Command } from "effect/unstable/cli";

import { runServiceLauncherCli } from "../serviceLauncher.ts";

/**
 * Registers the hidden command for the CLI parser. The process entrypoint
 * dispatches it directly before loading the CLI's server dependencies.
 *
 * The launcher owns SIGTERM handling and the process lifetime: it must finish
 * stopping its child before the process exits, so it runs detached from the
 * CLI's fiber rather than under `runMain`, whose signal handler would
 * interrupt the fiber and exit while the child is still being terminated.
 */
export const serviceLauncherCommand = Command.make("__service-launcher").pipe(
  Command.unlisted,
  Command.withHandler(() =>
    Effect.sync(() => {
      void runServiceLauncherCli([]);
    }),
  ),
);
