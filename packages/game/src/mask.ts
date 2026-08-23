import type { DecisionBrief, PanelVerdict, TurnRecord } from "./types";
import { HUMAN_MODEL, MASKED_MODEL, SCRIPTED_MODEL } from "./types";

/** A brief with its model id masked unless it was the human's or scripted. */
export const maskBrief = (brief: DecisionBrief): DecisionBrief => ({
  ...structuredClone(brief),
  model:
    brief.model === HUMAN_MODEL || brief.model === SCRIPTED_MODEL
      ? brief.model
      : MASKED_MODEL,
});

/** A panel verdict with its judge's model id masked unless it was the human. */
export const maskVerdict = (verdict: PanelVerdict): PanelVerdict => ({
  ...structuredClone(verdict),
  model: verdict.model === HUMAN_MODEL ? HUMAN_MODEL : MASKED_MODEL,
});

/** A turn record with every model id (seats and panel) masked. */
export const maskTurn = (turn: TurnRecord): TurnRecord => ({
  ...turn,
  briefs: turn.briefs.map(maskBrief),
  ...(turn.adjudication
    ? {
        adjudication: {
          ...structuredClone(turn.adjudication),
          panel: turn.adjudication.panel.map(maskVerdict),
        },
      }
    : {}),
});
