export type LifeCategory = 'career' | 'romance' | 'inner' | 'twist';

export interface LifeNode {
  id: string;
  parentId?: string;
  layerIndex: number; // 0: 假说分歧点, 1: 1年后涟漪, 2: 3年后质变, 3: 5年后分道, 4: 10年后平行归宿
  eraLabel: string;
  title: string;
  scenarioDescription: string;
  vitality: number; // 0 - 100
  isPruned: boolean;
  waterCount: number;
  category: LifeCategory;
  categoryName: string;
  color: string;
  specimenQuote: string;
  childrenIds: string[];
}

export interface LifeSpecimen {
  id: string;
  nodeId: string;
  title: string;
  eraLabel: string;
  assumption: string;
  pathWay: string[];
  quote: string;
  butterflyTag: string;
  resonanceRating: number;
  harvestedAt: string;
}

export interface CounterfactualTree {
  id: string;
  assumption: string;
  rootId: string;
  nodes: Record<string, LifeNode>;
  createdAt: string;
  specimens: LifeSpecimen[];
  operations: WaterOperation[];
}

/**
 * 浇水操作记录：每次“确认浇水”后写入 tree.operations，
 * 作为撤销（逆操作）的唯一依据。
 */
export interface WaterOperation {
  id: string;
  nodeId: string;
  nodeTitle: string;
  eraLabel: string;
  vitalityBefore: number;
  vitalityAfter: number;
  vitalityGain: number;
  waterCountBefore: number;
  waterCountAfter: number;
  /** 本次浇水若萌发了奇遇枝桠，记录其节点 id，撤销时一并移除 */
  sproutId?: string;
  sproutTitle?: string;
  wateredAt: string;
}

/** 确认前的预览：仅描述预计变化，不持有任何状态，取消即可丢弃 */
export interface WaterPreview {
  nodeId: string;
  nodeTitle: string;
  eraLabel: string;
  categoryName: string;
  vitalityBefore: number;
  vitalityAfter: number;
  vitalityGain: number;
  waterCountBefore: number;
  waterCountAfter: number;
  /** 本次浇水恰好到达第 2 次且节点仍可分叉时，预计萌发奇遇枝桠 */
  willSprout: boolean;
  sproutTitle: string;
}

/** 确认提交后的结果：新树与本次写入的操作记录（节点无效时缺失） */
export interface WaterCommitResult {
  tree: CounterfactualTree;
  operation?: WaterOperation;
}
