import { PaperComponent } from '../types';

export interface HistoryEntry {
  id: string;
  action: string;
  timestamp: number;
  components: PaperComponent[];
  selectedCompId: string | null;
  heightMeters: number;
}

export interface HistoryManagerState {
  entries: HistoryEntry[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
}

const MAX_HISTORY = 60;

/**
 * Creates deep clone of components array to ensure immutable history snapshots
 */
export function cloneComponents(comps: PaperComponent[]): PaperComponent[] {
  return JSON.parse(JSON.stringify(comps));
}

export class HistoryManager {
  private entries: HistoryEntry[] = [];
  private currentIndex: number = 0;
  private debounceTimer: any = null;
  private pendingBatchAction: string | null = null;
  private onStateChange?: (state: HistoryManagerState) => void;

  constructor(
    initialComponents: PaperComponent[] = [],
    selectedCompId: string | null = null,
    heightMeters: number = 0,
    onStateChange?: (state: HistoryManagerState) => void
  ) {
    this.onStateChange = onStateChange;
    this.reset(initialComponents, selectedCompId, heightMeters);
  }

  /**
   * Reset history stack with initial state
   */
  public reset(
    initialComponents: PaperComponent[],
    selectedCompId: string | null = null,
    heightMeters: number = 0,
    label: string = 'Initial State'
  ): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingBatchAction = null;

    const initialEntry: HistoryEntry = {
      id: `hist_${Date.now()}_0`,
      action: label,
      timestamp: Date.now(),
      components: cloneComponents(initialComponents),
      selectedCompId,
      heightMeters,
    };

    this.entries = [initialEntry];
    this.currentIndex = 0;
    this.notify();
  }

  /**
   * Push a discrete action snapshot to history
   */
  public push(
    action: string,
    components: PaperComponent[],
    selectedCompId: string | null,
    heightMeters: number
  ): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingBatchAction = null;

    // Discard any redo states ahead of currentIndex
    const branch = this.entries.slice(0, this.currentIndex + 1);

    const newEntry: HistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      action,
      timestamp: Date.now(),
      components: cloneComponents(components),
      selectedCompId,
      heightMeters,
    };

    branch.push(newEntry);

    // Limit maximum undo steps to prevent excessive memory usage
    if (branch.length > MAX_HISTORY) {
      branch.shift();
    }

    this.entries = branch;
    this.currentIndex = branch.length - 1;
    this.notify();
  }

  /**
   * Debounced push for rapid continuous modifications (e.g. sliders, typing)
   * Groups continuous edits into a single undo step.
   */
  public pushDebounced(
    action: string,
    components: PaperComponent[],
    selectedCompId: string | null,
    heightMeters: number,
    delayMs: number = 400
  ): void {
    // If we're starting a new continuous batch action
    if (!this.pendingBatchAction || this.pendingBatchAction !== action) {
      this.pendingBatchAction = action;
      // Record the immediate state so first change is already branched
      const branch = this.entries.slice(0, this.currentIndex + 1);
      const newEntry: HistoryEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        action,
        timestamp: Date.now(),
        components: cloneComponents(components),
        selectedCompId,
        heightMeters,
      };
      branch.push(newEntry);
      if (branch.length > MAX_HISTORY) {
        branch.shift();
      }
      this.entries = branch;
      this.currentIndex = branch.length - 1;
      this.notify();
    } else {
      // Overwrite the current active entry with the latest value until user pauses
      const current = this.entries[this.currentIndex];
      if (current) {
        current.components = cloneComponents(components);
        current.selectedCompId = selectedCompId;
        current.heightMeters = heightMeters;
        current.timestamp = Date.now();
      }
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.pendingBatchAction = null;
      this.debounceTimer = null;
    }, delayMs);
  }

  /**
   * Undo to previous step
   */
  public undo(): HistoryEntry | null {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      this.pendingBatchAction = null;
    }

    if (this.currentIndex > 0) {
      this.currentIndex -= 1;
      const entry = this.entries[this.currentIndex];
      this.notify();
      return entry;
    }
    return null;
  }

  /**
   * Redo to next step
   */
  public redo(): HistoryEntry | null {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      this.pendingBatchAction = null;
    }

    if (this.currentIndex < this.entries.length - 1) {
      this.currentIndex += 1;
      const entry = this.entries[this.currentIndex];
      this.notify();
      return entry;
    }
    return null;
  }

  /**
   * Jump to specific historical entry index
   */
  public jumpTo(index: number): HistoryEntry | null {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      this.pendingBatchAction = null;
    }

    if (index >= 0 && index < this.entries.length) {
      this.currentIndex = index;
      const entry = this.entries[this.currentIndex];
      this.notify();
      return entry;
    }
    return null;
  }

  public get canUndo(): boolean {
    return this.currentIndex > 0;
  }

  public get canRedo(): boolean {
    return this.currentIndex < this.entries.length - 1;
  }

  public get currentEntry(): HistoryEntry | null {
    return this.entries[this.currentIndex] || null;
  }

  public get currentAction(): string {
    return this.currentEntry?.action || '';
  }

  public get undoAction(): string {
    if (this.currentIndex > 0) {
      return this.entries[this.currentIndex]?.action || 'Previous Action';
    }
    return '';
  }

  public get redoAction(): string {
    if (this.currentIndex < this.entries.length - 1) {
      return this.entries[this.currentIndex + 1]?.action || 'Next Action';
    }
    return '';
  }

  public getState(): HistoryManagerState {
    return {
      entries: [...this.entries],
      currentIndex: this.currentIndex,
      canUndo: this.canUndo,
      canRedo: this.canRedo,
    };
  }

  private notify(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }
}
