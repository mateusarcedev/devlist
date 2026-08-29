/**
 * Synchronization barrier for concurrent test scenarios.
 * Blocks all participants until the specified number of parties have arrived,
 * then releases them all simultaneously.
 */
export class Barrier {
  private readonly parties: number;
  private count = 0;
  private resolvers: Array<() => void> = [];
  private released = false;

  constructor(parties: number) {
    this.parties = parties;
  }

  async wait() {
    if (this.released) {
      return;
    }

    this.count += 1;

    if (this.count >= this.parties) {
      this.released = true;
      this.resolvers.forEach(resolve => resolve());
      this.resolvers = [];
      return;
    }

    await new Promise<void>(resolve => this.resolvers.push(resolve));
  }

  isReleased() {
    return this.released;
  }
}
