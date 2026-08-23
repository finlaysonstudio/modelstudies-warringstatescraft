import type {
  DecisionBrief,
  PanelVerdict,
  TurnAdjudication,
  TurnRecord,
} from "./types";
import { HUMAN_MODEL, MASKED_MODEL, SCRIPTED_MODEL } from "./types";

/** A brief with its model id masked unless it was the human's or scripted. */
export const maskBrief = (brief: DecisionBrief): DecisionBrief => {
  // usage items name the provider and model, so they go with the id
  const { usage: _usage, ...rest } = structuredClone(brief);
  return {
    ...rest,
    model:
      brief.model === HUMAN_MODEL || brief.model === SCRIPTED_MODEL
        ? brief.model
        : MASKED_MODEL,
  };
};

/** A panel verdict with its judge's model id masked unless it was the human. */
export const maskVerdict = (verdict: PanelVerdict): PanelVerdict => {
  const { usage: _usage, ...rest } = structuredClone(verdict);
  return {
    ...rest,
    model: verdict.model === HUMAN_MODEL ? HUMAN_MODEL : MASKED_MODEL,
  };
};

/** An adjudication with its judges masked and the narrator's usage dropped. */
const maskAdjudication = (adjudication: TurnAdjudication): TurnAdjudication => {
  const { narratorUsage: _usage, ...rest } = structuredClone(adjudication);
  return { ...rest, panel: adjudication.panel.map(maskVerdict) };
};

/** A turn record with every model id (seats and panel) masked. */
export const maskTurn = (turn: TurnRecord): TurnRecord => ({
  ...turn,
  briefs: turn.briefs.map(maskBrief),
  ...(turn.adjudication
    ? {
        adjudication: maskAdjudication(turn.adjudication),
      }
    : {}),
});
