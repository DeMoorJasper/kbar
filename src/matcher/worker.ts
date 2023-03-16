/* eslint-disable no-restricted-globals */

import commandScore from "@superhuman/command-score";

let lastQueryId = 0;
self.onmessage = (evt: MessageEvent<string>) => {
  const data = evt.data;
  if (typeof data === "object" && data["action"] === "match") {
    lastQueryId++;
    const currentQueryId = lastQueryId;
    const requestIdx = data["idx"];
    const searchQuery: string = data["searchQuery"];
    const actions: string[] = data["actions"];
    const matches: { score: number; idx: number }[] = [];
    for (let idx = 0; idx < actions.length; idx++) {
      const action = actions[idx];
      const score = commandScore(action, searchQuery);
      if (score > 0) {
        matches.push({ score, idx });
      }

      // If a new query has been started, stop processing this one.
      if (currentQueryId !== lastQueryId) {
        self.postMessage({
          idx: requestIdx,
          error: "Query cancelled",
        });
        return;
      }
    }

    self.postMessage({
      idx: requestIdx,
      result: matches.sort((a, b) => b.score - a.score).slice(0, 100),
    });
  }
};
