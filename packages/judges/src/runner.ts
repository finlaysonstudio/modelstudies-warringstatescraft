// The server-side judge runner: the browser board's runJob, headless. Every
// planned call fans out across every judging model through the worker pool;
// each task makes one LlmClient.operate call and settles one verdict. A
// verdict that cannot be parsed fails loud — status "error", never scored.

import type { LlmClient } from "@modelstudies/workflows";

import { parseVerdictJson, type JudgeCall, type JudgeVerdict } from "./judges";
import { runPool } from "./labelPipeline";

export type { JudgeVerdict } from "./judges";

const DEFAULT_CONCURRENCY = 8;

// Llm.operate with a format contract may hand back the parsed object rather
// than a string; either way the verdict keeps a raw string and, when the
// call is structured, a parsed data record.
function rawOf(content: unknown): string {
  if (typeof content === "string") return content;
  try {
    return JSON.stringify(content) ?? String(content);
  } catch {
    return String(content);
  }
}

function dataOf(content: unknown, raw: string): Record<string, unknown> | null {
  if (
    typeof content === "object" &&
    content !== null &&
    !Array.isArray(content)
  ) {
    return content as Record<string, unknown>;
  }
  return parseVerdictJson(raw);
}

export async function runJudgeCalls(input: {
  calls: JudgeCall[];
  models: string[];
  llm: LlmClient;
  concurrency?: number;
  log?: (message: string) => void;
}): Promise<JudgeVerdict[]> {
  const { calls, models, llm, concurrency = DEFAULT_CONCURRENCY, log } = input;
  const tasks: (() => Promise<JudgeVerdict>)[] = [];
  for (const call of calls) {
    for (const model of models) {
      tasks.push(async () => {
        // Key derivation matches the browser board: call key + ":" + model.
        const verdict: JudgeVerdict = {
          key: `${call.key}:${model}`,
          judge: call.judge,
          sight: call.sight,
          run: call.run,
          lap: call.lap,
          model,
          modelLabel: model,
          subject: call.subject,
          subjectLabel: call.subjectLabel,
          candidates: call.candidates,
          fields: call.fields,
          status: "running",
          raw: "",
        };
        try {
          const result = await llm.operate(call.user, {
            system: call.system,
            model,
          });
          const raw = rawOf(result.content);
          verdict.raw = raw;
          if (call.structured) {
            const data = dataOf(result.content, raw);
            if (data) {
              verdict.status = "done";
              verdict.data = data;
            } else {
              verdict.status = "error";
              verdict.error = "The verdict was not valid JSON.";
            }
          } else {
            verdict.status = "done";
          }
        } catch (error) {
          verdict.status = "error";
          verdict.error =
            error instanceof Error ? error.message : String(error);
        }
        log?.(
          `${verdict.key}: ${verdict.status}${
            verdict.error ? ` — ${verdict.error}` : ""
          }`,
        );
        return verdict;
      });
    }
  }
  return runPool(tasks, concurrency);
}
