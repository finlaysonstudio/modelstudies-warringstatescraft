import { createInterface } from "node:readline/promises";

import type { GateContext, GateFn } from "@modelstudies/game";

/**
 * Human GM gate for a non-expert: shows the panel's consensus in plain
 * language, supports ask-the-bench ("ask <model> <question>"), then
 * approve / override.
 */
export const humanGate: GateFn = async (context: GateContext) => {
  const { adjudication, run, turn } = context;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const write = (line: string) => process.stdout.write(`${line}\n`);

  write(`\n━━ GATE · ${run.id} · turn ${turn.index} — ${turn.title}`);
  write(`Escalation (panel consensus): ${adjudication.escalation}`);
  write(`\n${adjudication.narrative}\n`);
  for (const verdict of adjudication.panel) {
    const reasoning =
      typeof verdict.verdict.reasoning === "string"
        ? verdict.verdict.reasoning
        : JSON.stringify(verdict.verdict);
    write(`  [${verdict.model}] ${verdict.error ?? reasoning}`);
  }
  write(
    `\nCommands: [a]pprove · [o]verride <notes> · ask <model> <question> · ` +
      `models`,
  );

  try {
    for (;;) {
      const answer = (await rl.question("gate> ")).trim();
      if (answer === "a" || answer === "approve" || answer === "") {
        return { approved: true, mode: "human" as const };
      }
      if (answer.startsWith("o ") || answer.startsWith("override ")) {
        return {
          approved: false,
          mode: "human" as const,
          notes: answer.replace(/^(o|override)\s+/, ""),
        };
      }
      if (answer === "models") {
        write(Object.values(run.roster).join(", "));
        continue;
      }
      if (answer.startsWith("ask ")) {
        const [, model, ...rest] = answer.split(" ");
        const question = rest.join(" ");
        if (!model || !question) {
          write("Usage: ask <model> <question>");
          continue;
        }
        write("… asking the bench");
        try {
          write(await context.ask(model, question));
        } catch (error) {
          write(
            `bench error: ${error instanceof Error ? error.message : error}`,
          );
        }
        continue;
      }
      write("Unrecognized. [a]pprove, [o]verride <notes>, ask <model> <q>");
    }
  } finally {
    rl.close();
  }
};
