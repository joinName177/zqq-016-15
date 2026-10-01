import { CounterfactualTree, LifeSpecimen, WaterPreview, WaterCommitResult } from '../core/models';

export interface TreeEnginePort {
  createTree(assumption: string): CounterfactualTree;
  /** 浇水预览：仅计算预计变化，不修改树 */
  previewWater(tree: CounterfactualTree, nodeId: string): WaterPreview | null;
  /** 确认浇水：原子更新树并写入操作记录 */
  commitWater(tree: CounterfactualTree, nodeId: string): WaterCommitResult;
  /** 某条浇水记录是否可撤销 */
  canUndoWater(tree: CounterfactualTree, operationId: string): { ok: boolean; reason?: string };
  /** 撤销浇水：按记录还原树 */
  undoWater(tree: CounterfactualTree, operationId: string): CounterfactualTree;
  prune(tree: CounterfactualTree, nodeId: string): CounterfactualTree;
  harvest(tree: CounterfactualTree, nodeId: string): LifeSpecimen;
}
