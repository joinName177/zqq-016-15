import { CounterfactualTree, LifeSpecimen, WaterPreview, WaterCommitResult } from '../core/models';
import {
  buildCounterfactualTree,
  previewWater,
  commitWater,
  canUndoWater,
  undoWater,
  pruneBranch,
  harvestSpecimen
} from '../core/tree-engine';
import { TreeEnginePort } from '../ports/tree-engine.port';

export class TreeEngineAdapter implements TreeEnginePort {
  createTree(assumption: string): CounterfactualTree {
    return buildCounterfactualTree(assumption);
  }

  previewWater(tree: CounterfactualTree, nodeId: string): WaterPreview | null {
    return previewWater(tree, nodeId);
  }

  commitWater(tree: CounterfactualTree, nodeId: string): WaterCommitResult {
    return commitWater(tree, nodeId);
  }

  canUndoWater(tree: CounterfactualTree, operationId: string): { ok: boolean; reason?: string } {
    return canUndoWater(tree, operationId);
  }

  undoWater(tree: CounterfactualTree, operationId: string): CounterfactualTree {
    return undoWater(tree, operationId);
  }

  prune(tree: CounterfactualTree, nodeId: string): CounterfactualTree {
    return pruneBranch(tree, nodeId);
  }

  harvest(tree: CounterfactualTree, nodeId: string): LifeSpecimen {
    return harvestSpecimen(tree, nodeId);
  }
}
