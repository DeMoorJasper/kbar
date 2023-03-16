import { deepEqual } from "fast-equals";
import * as React from "react";
import invariant from "tiny-invariant";
import { ActionInterface } from "./action/ActionInterface";
import { history } from "./action/HistoryImpl";
import type {
  Action,
  IKBarContext,
  KBarOptions,
  KBarProviderProps,
  KBarState,
} from "./types";
import { VisualState } from "./types";

type useStoreProps = KBarProviderProps;
type UpdateStateFn = (state: KBarState) => KBarState;

export function useStore(props: useStoreProps) {
  const optionsRef = React.useRef({
    animations: {
      enterMs: 200,
      exitMs: 100,
    },
    ...props.options,
  } as KBarOptions);

  const [actionsInterface] = React.useState(() => {
    return new ActionInterface(props.actions || [], {
      historyManager: optionsRef.current.enableHistory ? history : undefined,
    });
  });

  const stateRef = React.useRef<KBarState>({
    searchQuery: "",
    currentRootActionId: null,
    visualState: VisualState.hidden,
    actions: { ...actionsInterface.actions },
    activeIndex: 0,
  });

  const getState = React.useCallback(() => stateRef.current, []);
  const [publisher] = React.useState(() => new Publisher(getState));

  const setState = React.useCallback(
    (update: UpdateStateFn): void => {
      stateRef.current = update(stateRef.current);
      publisher.notify();
    },
    [publisher]
  );

  const registerActions = React.useCallback(
    (actions: Action[]) => {
      setState((state) => {
        return {
          ...state,
          actions: actionsInterface.add(actions),
        };
      });

      return function unregister() {
        setState((state) => {
          return {
            ...state,
            actions: actionsInterface.remove(actions),
          };
        });
      };
    },
    [setState, actionsInterface]
  );

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  return React.useMemo(() => {
    return {
      getState,
      query: {
        setCurrentRootAction: (actionId) => {
          setState((state) => ({
            ...state,
            currentRootActionId: actionId,
          }));
        },
        setVisualState: (cb) => {
          setState((state) => ({
            ...state,
            visualState: typeof cb === "function" ? cb(state.visualState) : cb,
          }));
        },
        setSearch: (searchQuery) =>
          setState((state) => ({
            ...state,
            searchQuery,
          })),
        registerActions,
        toggle: () =>
          setState((state) => ({
            ...state,
            visualState: [
              VisualState.animatingOut,
              VisualState.hidden,
            ].includes(state.visualState)
              ? VisualState.animatingIn
              : VisualState.animatingOut,
          })),
        setActiveIndex: (cb) =>
          setState((state) => ({
            ...state,
            activeIndex: typeof cb === "number" ? cb : cb(state.activeIndex),
          })),
        inputRefSetter: (el: HTMLInputElement) => {
          inputRef.current = el;
        },
        getInput: () => {
          invariant(
            inputRef.current,
            "Input is undefined, make sure you apple `query.inputRefSetter` to your search input."
          );
          return inputRef.current;
        },
      },
      options: optionsRef.current,
      subscribe: (collector, cb) => publisher.subscribe(collector, cb),
    } as IKBarContext;
  }, [getState, publisher, registerActions, setState]);
}

class Publisher {
  getState;
  subscribers: Subscriber[] = [];

  constructor(getState: () => KBarState) {
    this.getState = getState;
  }

  subscribe<C>(
    collector: (state: KBarState) => C,
    onChange: (collected: C) => void
  ) {
    const subscriber = new Subscriber(
      () => collector(this.getState()),
      onChange
    );
    this.subscribers.push(subscriber);
    return this.unsubscribe.bind(this, subscriber);
  }

  unsubscribe(subscriber: Subscriber) {
    if (this.subscribers.length) {
      const index = this.subscribers.indexOf(subscriber);
      if (index > -1) {
        return this.subscribers.splice(index, 1);
      }
    }
  }

  notify() {
    this.subscribers.forEach((subscriber) => subscriber.collect());
  }
}

class Subscriber {
  collected: any;
  collector;
  onChange;

  constructor(collector: () => any, onChange: (collected: any) => any) {
    this.collector = collector;
    this.onChange = onChange;
  }

  collect() {
    try {
      // grab latest state
      const recollect = this.collector();
      if (!deepEqual(recollect, this.collected)) {
        this.collected = recollect;
        if (this.onChange) {
          this.onChange(this.collected);
        }
      }
    } catch (error) {
      console.warn(error);
    }
  }
}
