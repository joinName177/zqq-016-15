import { CounterfactualTree, LifeSpecimen, LifeNode, WaterPreview } from '../core/models';

/** 当前浇水确认框的 Esc 处理器；每次重渲染时替换，避免残留过期闭包 */
let activeEscapeHandler: ((e: KeyboardEvent) => void) | null = null;


export interface TreeUIHandlers {
  onGrowNewTree: (assumption: string) => void;
  /** 点击浇水按钮：请求预览并打开确认框（此时树不发生任何变化） */
  onRequestWater: (nodeId: string) => void;
  /** 确认浇水：原子更新树与操作记录 */
  onConfirmWater: (nodeId: string) => void;
  /** 取消浇水：丢弃预览，不留半完成状态 */
  onCancelWater: () => void;
  /** 撤销某条浇水记录 */
  onUndoWater: (operationId: string) => void;
  onPruneNode: (nodeId: string) => void;
  onHarvestNode: (nodeId: string) => void;
  onDeleteSpecimen: (id: string) => void;
  onToggleCabinet: (open: boolean) => void;
}

export function renderTreeApp(
  container: HTMLElement,
  tree: CounterfactualTree,
  specimens: LifeSpecimen[],
  isCabinetOpen: boolean,
  presets: string[],
  waterPreview: WaterPreview | null,
  handlers: TreeUIHandlers
) {
  const esc = (s: string) =>
    s.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));

  // Organize nodes by layer index (0 to 4)
  const layers: LifeNode[][] = [[], [], [], [], []];
  Object.values(tree.nodes).forEach(n => {
    if (layers[n.layerIndex]) {
      layers[n.layerIndex].push(n);
    }
  });

  const eraTitles = ['起点分歧点', '+1年·涟漪微漾', '+3年·风向转折', '+5年·航道分野', '+10年·宿命标本'];

  container.innerHTML = `
    <div class="tree-app">
      <header class="app-header">
        <div class="brand">
          <div class="tree-icon">🌿</div>
          <div>
            <h1>反事实平行人生树 · 平行人生标本集</h1>
            <p>COUNTERFACTUAL LIFE TREE &amp; PARALLEL SPECIMENS · v1.0.0</p>
          </div>
        </div>
        <button class="cabinet-btn" id="btnOpenCabinet">
          🗄️ 平行人生标本馆 (${specimens.length})
        </button>
      </header>

      <!-- Assumption Generator Hub -->
      <section class="generator-hub">
        <div class="assumption-input-wrap">
          <input type="text" class="assumption-input" id="assumptionInput" value="${esc(tree.assumption)}" placeholder="输入一个'如果当初……'的假设，观察平行人生分支生长" />
          <button class="btn-grow" id="btnGrowTree">生长反事实树 🌱</button>
        </div>
        <div class="preset-list">
          <span style="color:var(--text-muted);">经典假设母题：</span>
          ${presets.map(p => `<button class="btn-preset" data-preset="${esc(p)}">${esc(p)}</button>`).join('')}
        </div>
      </section>

      <!-- Main Tree Container -->
      <main class="tree-container">
        <div class="tree-header">
          <h2>🌳 当前反事实时空谱系：${esc(tree.assumption)}</h2>
          <span style="font-size:12px;color:var(--text-muted);">
            提示：点击【💧浇水】注入可能性能量，点击【✂️修剪】减除不想要的走向，点击【📌采集】定格标本
          </span>
        </div>

        <div class="generations-track">
          ${layers
            .map(
              (layerNodes, idx) => `
            <div class="generation-column">
              <div class="column-header">${eraTitles[idx]}</div>
              ${layerNodes
                .map(
                  node => `
                <div class="node-card ${node.isPruned ? 'pruned' : ''}" 
                     style="--cat-color: ${node.color};" 
                     data-id="${node.id}">
                  <span class="node-category-tag">${esc(node.categoryName)}</span>
                  <div class="node-title">${esc(node.title)}</div>
                  <div class="node-desc">${esc(node.scenarioDescription)}</div>
                  <div class="node-quote">${esc(node.specimenQuote)}</div>
                  
                  <div class="vitality-bar-bg">
                    <div class="vitality-bar-fill" style="width: ${node.vitality}%;"></div>
                  </div>

                  <div class="node-actions">
                    <button class="btn-action btn-water" data-id="${node.id}" title="注入生命力" ${node.isPruned ? 'disabled' : ''}>
                      💧 浇水 (${node.waterCount})
                    </button>
                    <button class="btn-action btn-prune" data-id="${node.id}" title="剪除此分支">
                      ✂️ 修剪
                    </button>
                    <button class="btn-action btn-harvest" data-id="${node.id}" title="收录进标本馆">
                      📌 采集标本
                    </button>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          `
            )
            .join('')}
        </div>
      </main>

      <!-- Watering Operation Log (undoable) -->
      <section class="water-log-panel">
        <div class="water-log-header">
          <h3>💧 浇水操作记录</h3>
          <span class="water-log-hint">仅最近一次浇水可撤销；若分支其后被修剪，则撤销关闭</span>
        </div>
        ${
          tree.operations.length === 0
            ? `
          <div class="water-log-empty">
            尚无浇水记录。点击节点上的【💧 浇水】，确认后变更将记录于此，并可一键撤销。
          </div>
        `
            : `
          <ul class="water-log-list">
            ${[...tree.operations]
              .reverse()
              .map((op, revIdx) => {
                const isLatest = revIdx === 0;
                const disabledAttr = isLatest ? '' : 'disabled';
                const btnLabel = isLatest
                  ? '↩ 撤销此次浇水'
                  : '仅可撤销最近一次';
                return `
              <li class="water-log-item${op.sproutId ? ' has-sprout' : ''}">
                <div class="water-log-main">
                  <span class="water-log-time">${esc(op.wateredAt)}</span>
                  <span class="water-log-node">${esc(op.eraLabel)} · ${esc(op.nodeTitle)}</span>
                  <span class="water-log-change">
                    生命力 ${op.vitalityBefore} → ${op.vitalityAfter}（+${op.vitalityGain}）
                    ｜ 浇水次数 ${op.waterCountBefore} → ${op.waterCountAfter}
                  </span>
                  ${
                    op.sproutId
                      ? `<span class="water-log-sprout">🌱 催生枝桠：${esc(op.sproutTitle || '突发奇遇')}</span>`
                      : ''
                  }
                </div>
                <button class="btn-undo-water" data-opid="${op.id}" ${disabledAttr}
                  title="${isLatest ? '撤销本次浇水的全部变化' : '只能撤销最近一次浇水'}">
                  ${btnLabel}
                </button>
              </li>
            `;
              })
              .join('')}
          </ul>
        `
        }
      </section>

      <!-- Water Confirmation Modal -->
      ${
        waterPreview
          ? `
        <div class="modal-overlay" id="waterConfirmOverlay">
          <div class="modal-content water-confirm-content">
            <div class="cabinet-header">
              <h2>💧 确认浇水</h2>
            </div>
            <div class="water-confirm-body">
              <div class="water-confirm-block">
                <div class="water-confirm-label">目标节点</div>
                <div class="water-confirm-node-title">${esc(waterPreview.nodeTitle)}</div>
                <div class="water-confirm-node-meta">
                  <span>${esc(waterPreview.eraLabel)}</span>
                  <span class="water-confirm-cat">${esc(waterPreview.categoryName)}</span>
                </div>
              </div>

              <div class="water-confirm-block">
                <div class="water-confirm-label">预计变化</div>
                <div class="water-confirm-change-row">
                  <span>生命力</span>
                  <span class="water-confirm-values">
                    ${waterPreview.vitalityBefore}
                    <span class="water-arrow">→</span>
                    <strong>${waterPreview.vitalityAfter}</strong>
                    <em class="water-gain">(+${waterPreview.vitalityGain})</em>
                  </span>
                </div>
                <div class="water-confirm-change-row">
                  <span>浇水次数</span>
                  <span class="water-confirm-values">
                    ${waterPreview.waterCountBefore}
                    <span class="water-arrow">→</span>
                    <strong>${waterPreview.waterCountAfter}</strong>
                  </span>
                </div>
                ${
                  waterPreview.willSprout
                    ? `
                  <div class="water-confirm-sprout">
                    🌱 本次为第 2 次浇水，预计催生奇遇枝桠：<strong>${esc(waterPreview.sproutTitle)}</strong>
                  </div>
                `
                    : ''
                }
              </div>

              <div class="water-confirm-note">
                确认后树与操作记录将同步更新，可在下方“浇水操作记录”中撤销；取消则不产生任何变化。
              </div>
            </div>

            <div class="water-confirm-actions">
              <button class="btn-action btn-confirm-cancel" id="btnCancelWater">取消</button>
              <button class="cabinet-btn" id="btnConfirmWater">💧 确认浇水</button>
            </div>
          </div>
        </div>
      `
          : ''
      }

      <!-- Specimen Cabinet Modal -->
      ${
        isCabinetOpen
          ? `
        <div class="modal-overlay" id="cabinetOverlay">
          <div class="modal-content">
            <div class="cabinet-header">
              <h2>🗄️ 平行人生植物学标本集 (Herbarium of What-Ifs)</h2>
              <button class="btn-action" id="btnCloseCabinet" style="font-size:16px;">✕ 关闭</button>
            </div>

            ${
              specimens.length === 0
                ? `
              <div style="text-align:center;padding:40px;color:var(--text-muted);">
                🌱 标本柜暂空。请在反事实树上点击节点的【📌 采集标本】按钮，将某段平行人生命运封存入馆。
              </div>
            `
                : `
              <div class="specimens-grid">
                ${specimens
                  .map(
                    s => `
                  <div class="specimen-card">
                    <span class="specimen-tag">标本领域 · ${esc(s.butterflyTag)}</span>
                    <div class="specimen-title">${esc(s.title)}</div>
                    <div class="specimen-quote">${esc(s.quote)}</div>
                    <div class="specimen-path">
                      <strong>演化因果链：</strong><br />
                      ${s.pathWay.map(p => `↳ ${esc(p)}`).join('<br />')}
                    </div>
                    <div class="specimen-footer">
                      <span>采集时空：${s.harvestedAt}</span>
                      <button class="btn-del-specimen" data-delid="${s.id}">移出标本集</button>
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
              <div style="text-align:right;margin-top:24px;">
                <button class="cabinet-btn" onclick="window.print()">🖨️ 导出 / 打印标本图册</button>
              </div>
            `
            }
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;

  // Attach event listeners
  container.querySelector('#btnOpenCabinet')?.addEventListener('click', () => handlers.onToggleCabinet(true));
  container.querySelector('#btnCloseCabinet')?.addEventListener('click', () => handlers.onToggleCabinet(false));
  container.querySelector('#cabinetOverlay')?.addEventListener('click', e => {
    if (e.target === container.querySelector('#cabinetOverlay')) {
      handlers.onToggleCabinet(false);
    }
  });

  const inputEl = container.querySelector('#assumptionInput') as HTMLInputElement;
  const triggerGrow = () => {
    const val = inputEl.value.trim();
    if (val) handlers.onGrowNewTree(val);
  };

  container.querySelector('#btnGrowTree')?.addEventListener('click', triggerGrow);
  inputEl?.addEventListener('keydown', e => {
    if (e.key === 'Enter') triggerGrow();
  });

  container.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      if (preset) {
        inputEl.value = preset;
        handlers.onGrowNewTree(preset);
      }
    });
  });

  // Action buttons on nodes
  container.querySelectorAll('.btn-water').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (id) handlers.onRequestWater(id);
    });
  });

  // Water confirmation modal
  const doCancel = () => handlers.onCancelWater();
  const waterOverlay = container.querySelector('#waterConfirmOverlay');
  container.querySelector('#btnCancelWater')?.addEventListener('click', doCancel);
  container.querySelector('#btnConfirmWater')?.addEventListener('click', () => {
    if (waterPreview) handlers.onConfirmWater(waterPreview.nodeId);
  });
  waterOverlay?.addEventListener('click', e => {
    if (e.target === waterOverlay) doCancel();
  });
  if (activeEscapeHandler) {
    document.removeEventListener('keydown', activeEscapeHandler);
    activeEscapeHandler = null;
  }
  if (waterPreview) {
    activeEscapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') doCancel();
    };
    document.addEventListener('keydown', activeEscapeHandler);
  }

  // Undo buttons in the watering operation log
  container.querySelectorAll('.btn-undo-water').forEach(btn => {
    btn.addEventListener('click', () => {
      const opId = btn.getAttribute('data-opid');
      if (opId && !btn.hasAttribute('disabled')) handlers.onUndoWater(opId);
    });
  });

  container.querySelectorAll('.btn-prune').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (id) handlers.onPruneNode(id);
    });
  });

  container.querySelectorAll('.btn-harvest').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (id) handlers.onHarvestNode(id);
    });
  });

  container.querySelectorAll('.btn-del-specimen').forEach(btn => {
    btn.addEventListener('click', () => {
      const delId = btn.getAttribute('data-delid');
      if (delId) handlers.onDeleteSpecimen(delId);
    });
  });
}
