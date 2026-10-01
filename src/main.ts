import './ui/styles.css';
import { TreeEngineAdapter } from './adapters/tree-engine.adapter';
import { LocalSpecimenAdapter } from './adapters/local-specimen.adapter';
import { CounterfactualTree, WaterPreview } from './core/models';
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
/** 待确认的浇水预览；为 null 表示确认框关闭。它只是一份计算结果，不改动树 */
let waterPreview: WaterPreview | null = null;

const rootEl = document.getElementById('app')!;

function refreshView() {
  const specimens = specimenAdapter.getAll();

  renderTreeApp(
    rootEl,
    currentTree,
    specimens,
    isCabinetOpen,
    PRESETS,
    waterPreview,
    {
      onGrowNewTree: (assumption: string) => {
        // 新树是全新时空，连同未确认的浇水选择一起作废
        waterPreview = null;
        currentTree = treeAdapter.createTree(assumption);
        refreshView();
      },
      onRequestWater: (nodeId: string) => {
        // 只生成预览：树尚未改变，取消时丢弃即可，无半完成状态
        waterPreview = treeAdapter.previewWater(currentTree, nodeId);
        refreshView();
      },
      onConfirmWater: (nodeId: string) => {
        // 原子提交：节点变化（含可能的新枝桠）与操作记录同步完成
        const result = treeAdapter.commitWater(currentTree, nodeId);
        if (result.operation) {
          currentTree = result.tree;
        }
        waterPreview = null;
        refreshView();
      },
      onCancelWater: () => {
        // 仅丢弃预览，树与操作记录均未被动过
        waterPreview = null;
        refreshView();
      },
      onUndoWater: (operationId: string) => {
        const guard = treeAdapter.canUndoWater(currentTree, operationId);
        if (!guard.ok) {
          alert(guard.reason || '当前状态下无法撤销此次浇水');
          refreshView();
          return;
        }
        currentTree = treeAdapter.undoWater(currentTree, operationId);
        refreshView();
      },
      onPruneNode: (nodeId: string) => {
        waterPreview = null;
        currentTree = treeAdapter.prune(currentTree, nodeId);
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
