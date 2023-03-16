// @ts-ignore
import MatchWorker from './matcher.worker';

export interface IWorkerMatch {
  score: number;
  idx: number;
}

export class MatchWorkerController {
  private worker: Worker;
  private promisesMap = new Map<
    number,
    { resolve: (matches: IWorkerMatch[]) => void; reject: (err: Error) => void }
  >();
  private lastIdx = 0;

  constructor() {
    this.worker = MatchWorker();
    this.worker.onmessage = (evt: MessageEvent<string>) => {
      const data = evt.data;
      if (typeof data === "object") {
        const idx = data["idx"];
        const promise = this.promisesMap.get(idx);
        if (promise) {
          if (data["error"]) {
            promise.reject(new Error(data["error"]));
          } else {
            const matches = data["result"];
            promise.resolve(matches ?? []);
          }
        }
      }
    };
  }

  requestMatches(
    queryString: string,
    actions: string[]
  ): Promise<IWorkerMatch[]> {
    this.lastIdx += 1;
    const idx = this.lastIdx;
    return new Promise((resolve, reject) => {
      this.promisesMap.set(idx, { resolve, reject });

      this.worker.postMessage({
        action: "match",
        idx,
        searchQuery: queryString,
        actions,
      });
    });
  }
}
