import { useLocation } from "react-router-dom";
import { CAMPAIGNS, type Campaign } from "../campaigns";

/**
 * The campaign the current path sits under, derived from the first path
 * segment. The chrome (breadcrumb, back link, section bar) reads this; a
 * page outside both campaigns gets null.
 */
export function useCampaign(): Campaign | null {
  const { pathname } = useLocation();
  const segment = pathname.split("/")[1];
  return segment === "craft" || segment === "awry" || segment === "annals"
    ? CAMPAIGNS[segment]
    : null;
}
