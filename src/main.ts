import './ui/styles.css';
import { TreeEngineAdapter } from './adapters/tree-engine.adapter';
import { LocalSpecimenAdapter } from './adapters/local-specimen.adapter';
import { CounterfactualTree } from './core/models';
import { renderTreeApp } from './ui/app';

const treeAdapter = new TreeEngineAdapter();
const specimenAdapter = new LocalSpecimenAdapter();

const PRESETS = [
  '如果当初我留在了故乡小城',
  '如果当初我鼓起勇气向TA表白了心意',
  '如果当年我选择了读纯艺术专业',
  '如果当年我没有接受那家大厂的Offer'
];

let currentTree: CounterfactualTree = treeAdapter.createTree(PRESETS[0]);
let isCabinetOpen = false;
// 待确认的浇水目标：仅保存 nodeId，预览数据每次渲染时由引擎纯计算得出。
// 取消时清空即可，树与操作记录从未被改动，不会留下半完成状态。
let pendingWaterNodeId: string | null = null;

const rootEl = document.getElementById('app')!;

function refreshView() {
  const specimens = specimenAdapter.getAll();
  const waterPreview = pendingWaterNodeId
    ? treeAdapter.previewWater(currentTree, pendingWaterNodeId)
    : null;

  renderTreeApp(
    rootEl,
    currentTree,
    specimens,
    isCabinetOpen,
    PRESETS,
    waterPreview,
    {
      onGrowNewTree: (assumption: string) => {
        currentTree = treeAdapter.createTree(assumption);
        pendingWaterNodeId = null;
        refreshView();
      },
      onRequestWater: (nodeId: string) => {
        pendingWaterNodeId = nodeId;
        refreshView();
      },
      onConfirmWater: (nodeId: string) => {
        // 确认后才真正更新树与浇水操作记录（不可变更新）
        currentTree = treeAdapter.water(currentTree, nodeId);
        pendingWaterNodeId = null;
        refreshView();
      },
      onCancelWater: () => {
        pendingWaterNodeId = null;
        refreshView();
      },
      onUndoLastWater: () => {
        currentTree = treeAdapter.undoLastWater(currentTree);
        pendingWaterNodeId = null;
        refreshView();
      },
      onPruneNode: (nodeId: string) => {
        currentTree = treeAdapter.prune(currentTree, nodeId);
        pendingWaterNodeId = null;
        refreshView();
      },
      onHarvestNode: (nodeId: string) => {
        const sp = treeAdapter.harvest(currentTree, nodeId);
        specimenAdapter.save(sp);
        alert(`已成功将节点【${sp.title}】收入平行人生标本馆！`);
        refreshView();
      },
      onDeleteSpecimen: (id: string) => {
        specimenAdapter.remove(id);
        refreshView();
      },
      onToggleCabinet: (open: boolean) => {
        isCabinetOpen = open;
        refreshView();
      }
    }
  );
}

// Initial render
refreshView();
