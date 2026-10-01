import { CounterfactualTree, LifeSpecimen, WaterPreview } from '../core/models';
import {
  buildCounterfactualTree,
  previewWater,
  waterBranch,
  undoLastWater,
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

  water(tree: CounterfactualTree, nodeId: string): CounterfactualTree {
    return waterBranch(tree, nodeId);
  }

  undoLastWater(tree: CounterfactualTree): CounterfactualTree {
    return undoLastWater(tree);
  }

  prune(tree: CounterfactualTree, nodeId: string): CounterfactualTree {
    return pruneBranch(tree, nodeId);
  }

  harvest(tree: CounterfactualTree, nodeId: string): LifeSpecimen {
    return harvestSpecimen(tree, nodeId);
  }
}
