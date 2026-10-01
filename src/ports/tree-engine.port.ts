import { CounterfactualTree, LifeSpecimen, WaterPreview } from '../core/models';

export interface TreeEnginePort {
  createTree(assumption: string): CounterfactualTree;
  previewWater(tree: CounterfactualTree, nodeId: string): WaterPreview | null;
  water(tree: CounterfactualTree, nodeId: string): CounterfactualTree;
  undoLastWater(tree: CounterfactualTree): CounterfactualTree;
  prune(tree: CounterfactualTree, nodeId: string): CounterfactualTree;
  harvest(tree: CounterfactualTree, nodeId: string): LifeSpecimen;
}
