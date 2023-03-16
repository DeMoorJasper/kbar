import * as React from "react";
import { KBarContext } from "./KBarContextProvider";
import type { IKBarContext } from "./types";

export function useKBarContext(): IKBarContext {
  return React.useContext(KBarContext);
}
