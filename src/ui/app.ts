import { CounterfactualTree, LifeSpecimen, LifeNode, WaterPreview } from '../core/models';

export interface TreeUIHandlers {
  onGrowNewTree: (assumption: string) => void;
  onRequestWater: (nodeId: string) => void;
  onConfirmWater: (nodeId: string) => void;
  onCancelWater: () => void;
  onUndoLastWater: () => void;
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
            提示：点击【💧浇水】确认后注入可能性能量（可在下方操作记录中撤销），点击【✂️修剪】减除不想要的走向，点击【📌采集】定格标本
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

      <!-- Watering Operation Records -->
      <section class="water-log">
        <div class="water-log-header">
          <h3>💧 浇水操作记录</h3>
          <button class="btn-action btn-undo" id="btnUndoWater"
            ${tree.waterHistory.some(r => !r.undone) ? '' : 'disabled'}>
            ↩ 撤销最近一次浇水
          </button>
        </div>
        ${
          tree.waterHistory.length === 0
            ? `<p class="water-log-empty">尚无浇水记录。对节点执行浇水并确认后，记录将在此留痕，可随时撤销。</p>`
            : `
          <ul class="water-log-list">
            ${[...tree.waterHistory].reverse().map(r => `
              <li class="water-log-item ${r.undone ? 'undone' : ''}">
                <div class="water-log-main">
                  <span class="water-log-title">${esc(r.nodeTitle)}</span>
                  <span class="water-log-detail">
                    生命力 ${r.vitalityBefore} → ${r.vitalityAfter}
                    （+${r.vitalityAfter - r.vitalityBefore}）
                    · 浇水次数 ${r.waterCountBefore} → ${r.waterCountAfter}
                    ${r.sproutedNodeTitle ? `· ✨ 催生「${esc(r.sproutedNodeTitle)}」` : ''}
                  </span>
                </div>
                <span class="water-log-meta">
                  ${esc(r.createdAt)}${r.undone ? ' · 已撤销' : ''}
                </span>
              </li>
            `).join('')}
          </ul>`
        }
      </section>

      <!-- Water Confirmation Modal -->
      ${
        waterPreview
          ? `
        <div class="modal-overlay" id="waterConfirmOverlay">
          <div class="modal-content water-confirm-content">
            <div class="water-confirm-header">
              <h2>💧 浇水确认</h2>
            </div>
            <div class="water-confirm-body">
              <div class="water-confirm-row">
                <span class="water-confirm-label">目标节点</span>
                <div class="water-confirm-target">
                  <span class="node-category-tag" style="--cat-color: var(--leaf);">${esc(waterPreview.categoryName)}</span>
                  <strong>${esc(waterPreview.nodeTitle)}</strong>
                  <span class="water-confirm-era">${esc(waterPreview.eraLabel)}</span>
                </div>
              </div>
              <div class="water-confirm-row">
                <span class="water-confirm-label">预计变化</span>
                <ul class="water-confirm-changes">
                  <li>生命力：<strong>${waterPreview.vitalityBefore}</strong> → <strong class="change-positive">${waterPreview.vitalityAfter}</strong>
                    （+${waterPreview.vitalityDelta}）</li>
                  <li>浇水次数：<strong>${waterPreview.waterCountBefore}</strong> → <strong class="change-positive">${waterPreview.waterCountAfter}</strong></li>
                  ${
                    waterPreview.willSprout
                      ? `<li class="change-sprout">✨ 将催生奇遇枝桠：「${esc(waterPreview.sproutedNodeTitle)}」</li>`
                      : ''
                  }
                </ul>
              </div>
            </div>
            <div class="water-confirm-actions">
              <button class="btn-action btn-water-cancel" id="btnCancelWater">取消</button>
              <button class="cabinet-btn" id="btnConfirmWater">确认浇水</button>
            </div>
          </div>
        </div>`
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

  // Action buttons on nodes — watering goes through a confirmation modal first
  container.querySelectorAll('.btn-water').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (id) handlers.onRequestWater(id);
    });
  });

  container.querySelector('#btnUndoWater')?.addEventListener('click', () => {
    handlers.onUndoLastWater();
  });

  // Water confirmation modal
  const waterOverlayEl = container.querySelector('#waterConfirmOverlay');
  waterOverlayEl?.addEventListener('click', e => {
    if (e.target === waterOverlayEl) handlers.onCancelWater();
  });
  container.querySelector('#btnCancelWater')?.addEventListener('click', () => {
    handlers.onCancelWater();
  });
  container.querySelector('#btnConfirmWater')?.addEventListener('click', () => {
    if (waterPreview) handlers.onConfirmWater(waterPreview.nodeId);
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
