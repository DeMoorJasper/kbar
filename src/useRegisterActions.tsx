import * as React from "react";
import type { Action } from "./types";
import { useKBarContext } from "./useKBarContext";

export function useRegisterActions(
  actions: Action[],
  dependencies: React.DependencyList = []
) {
  const { query } = useKBarContext();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const actionsCache = React.useMemo(() => actions, dependencies);

  React.useEffect(() => {
    if (!actionsCache.length) {
      return;
    }

    const unregister = query.registerActions(actionsCache);
    return () => {
      unregister();
    };
  }, [query, actionsCache]);
}
