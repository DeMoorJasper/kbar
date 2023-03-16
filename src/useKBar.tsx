import * as React from "react";
import { KBarContext } from "./KBarContextProvider";
import type { KBarOptions, KBarQuery, KBarState } from "./types";

interface BaseKBarReturnType {
  getState: () => KBarState;
  query: KBarQuery;
  options: KBarOptions;
}

type useKBarReturnType<S = null> = S extends null
  ? BaseKBarReturnType
  : S & BaseKBarReturnType;

function isEqualObj(
  objA: Record<string, any>,
  objB: Record<string, any>
): boolean {
  if (objA === objB) {
    return true;
  }

  if (Object.keys(objA).length !== Object.keys(objB).length) {
    return false;
  }

  for (const key in objA) {
    if (objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
}

export function useKBar<C = null>(
  collector?: (state: KBarState) => C
): useKBarReturnType<C> {
  const { query, getState, subscribe, options } = React.useContext(KBarContext);

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

  const [render, setRender] = React.useState(onCollect(collected.current));

  React.useEffect(() => {
    let unsubscribe;
    if (collectorRef.current) {
      unsubscribe = subscribe(
        (current) => (collectorRef.current as any)(current),
        (collected) => {
          const newState = onCollect(collected);
          setRender((prev) => {
            if (isEqualObj(prev, newState)) {
              return prev;
            } else {
              return newState;
            }
          });
        }
      );
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [onCollect, subscribe]);

  return render;
}
