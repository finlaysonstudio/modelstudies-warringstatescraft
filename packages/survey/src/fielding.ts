/**
 * A fielding: one `interview-run`, the sittings it opened, and how they
 * stand. Written before the first sitting starts so an interrupted roster
 * has one id to resume by, and updated when the roster settles.
 */
import type { Entity } from "@modelstudies/workflows";
import { randomUUID } from "node:crypto";

import type { InterviewEntity, InterviewStatus } from "./interview";

export const FIELDING_MODEL = "fielding";

export type FieldingStatus = "active" | "complete" | "error";

export interface FieldingEntity extends Entity {
  model: typeof FIELDING_MODEL;
  scope: string;
  plan: string;
  panel?: string;
  models: string[];
  repetitions: number;
  explain?: string;
  condition?: string;
  language?: string;
  /** model id → interview id */
  interviews: Record<string, string>;
  status: FieldingStatus;
  statusDetail?: string;
  startedAt: string;
  completedAt?: string;
}

export const fieldingId = (): string =>
  `fielding_${randomUUID().replaceAll("-", "").slice(0, 8)}`;

/** The roster's standing from its sittings' statuses. */
export function fieldingStatus(
  sittings: Pick<InterviewEntity, "status" | "statusDetail">[],
): { status: FieldingStatus; statusDetail?: string } {
  const states = sittings.map((sitting) => sitting.status as InterviewStatus);
  const complete = states.filter((state) => state === "complete").length;
  if (states.length > 0 && complete === states.length) {
    return { status: "complete" };
  }
  const errors = states.filter((state) => state === "error").length;
  if (errors > 0) {
    return {
      status: "error",
      statusDetail: `${errors} of ${states.length} sittings failed`,
    };
  }
  const interrupted = sittings.filter((sitting) => sitting.statusDetail);
  return {
    status: "active",
    statusDetail:
      interrupted.length > 0
        ? `${complete}/${states.length} complete; ${interrupted[0]!.statusDetail}`
        : `${complete}/${states.length} complete`,
  };
}
