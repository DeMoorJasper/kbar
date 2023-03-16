import * as React from "react";
import type { KBarOptions, KBarQuery, KBarState } from "./types";
import { useKBarContext } from "./useKBarContext";

interface BaseKBarReturnType {
  getState: () => KBarState;
  query: KBarQuery;
  options: KBarOptions;
}

type useKBarReturnType<S = null> = S extends null
  ? BaseKBarReturnType
  : S & BaseKBarReturnType;

export function useKBar<C = null>(
  collector?: (state: KBarState) => C,
  debugName?: string
): useKBarReturnType<C> {
  const { query, getState, subscribe, options } = useKBarContext();

  const collected = React.useRef(collector?.(getState()));
  const collectorRef = React.useRef(collector);

  const onCollect = React.useCallback(
    (collected: any) => ({
      ...collected,
      query,
      options,
      getState,
    }),
    [query, options, getState]
  );

  const [render, setRender] = React.useState(() =>
    onCollect(collected.current)
  );

  React.useEffect(() => {
    let unsubscribe;
    if (collectorRef.current) {
      unsubscribe = subscribe(
        (current) => (collectorRef.current as any)(current),
        (collected) => setRender(onCollect(collected)),
        (options.debug && debugName) || ""
      );
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [onCollect, subscribe, options.debug, debugName]);

  return render;
}
