// @effect-diagnostics nodeBuiltinImport:off - tests the dependency-free process entrypoint.
import * as NodeChildProcess from "node:child_process";
import * as NodeFS from "node:fs";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";

import { expect, it } from "vite-plus/test";

import { SERVICE_LAUNCHER_PROTOCOL } from "./cloud/serviceProtocol.ts";

it("dispatches the service launcher without the CLI or its dependencies", () => {
  const scratch = NodeFS.mkdtempSync(NodePath.join(NodeOS.tmpdir(), "t3-launcher-entry-"));
  try {
    NodeFS.mkdirSync(NodePath.join(scratch, "cloud"));
    for (const file of [
      "bin.ts",
      "entrypoint.ts",
      "serviceLauncher.ts",
      "cloud/serviceProtocol.ts",
    ]) {
      NodeFS.copyFileSync(new URL(file, import.meta.url), NodePath.join(scratch, file));
    }
    const run = (args: ReadonlyArray<string>) =>
      NodeChildProcess.spawnSync(
        process.execPath,
        [
          "--experimental-strip-types",
          NodePath.join(scratch, "bin.ts"),
          "__service-launcher",
          ...args,
        ],
        {
          cwd: scratch,
          env: { PATH: "", T3CODE_HOME: NodePath.join(scratch, "empty-home") },
          encoding: "utf8",
          timeout: 10_000,
        },
      );
    const protocol = run(["--protocol-version"]);
    expect(protocol.status).toBe(0);
    expect(protocol.stdout.trim()).toBe(String(SERVICE_LAUNCHER_PROTOCOL));
    const missingState = run([]);
    expect(missingState.status).toBe(1);
    expect(missingState.stderr).toContain("service-state.json");
    const invalidArgs = run(["unexpected"]);
    expect(invalidArgs.status).toBe(1);
    expect(invalidArgs.stderr).toContain("Unexpected service launcher arguments");
  } finally {
    NodeFS.rmSync(scratch, { recursive: true, force: true });
  }
});
