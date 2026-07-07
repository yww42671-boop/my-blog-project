import { useState } from 'react';

const STORAGE_KEY = 'game_records';

function loadRecords() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function formatNow() {
  const d = new Date();
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const STATUS_OPTIONS = [
  { value: 'playing',    label: '🎮 正在玩',    color: '#4fc3f7' },
  { value: 'completed',  label: '✅ 已通关',    color: '#81c784' },
  { value: 'dropped',    label: '💤 搁置',      color: '#ffb74d' },
  { value: 'wishlist',   label: '⭐ 想玩',      color: '#ba68c8' },
];

const PLATFORM_OPTIONS = ['PC', 'PS5', 'PS4', 'Xbox Series X', 'Switch', 'Mobile', 'VR'];

/* ─── 主组件 ─── */
export default function GamePage({ onBack }) {
  const [records, setRecords] = useState(loadRecords);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const allTags = [...new Set(records.flatMap((r) => r.tags || []))].sort();

  function emptyForm(editTarget = null) {
    if (editTarget) {
      return {
        title: editTarget.title,
        platform: editTarget.platform,
        status: editTarget.status,
        rating: editTarget.rating,
        playTime: editTarget.playTime || '',
        saveNotes: editTarget.saveNotes || '',
        comment: editTarget.comment || '',
        images: [...(editTarget.images || [])],
        tags: [...(editTarget.tags || [])],
      };
    }
    return {
      title: '',
      platform: '',
      status: 'wishlist',
      rating: 0,
      playTime: '',
      saveNotes: '',
      comment: '',
      images: [],
      tags: [],
    };
  }

  /* 图片处理 */
  const addImages = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setForm((p) => ({ ...p, images: [...p.images, { data: ev.target.result, caption: '' }] }));
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (idx) =>
    setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));

  const updateCaption = (idx, caption) =>
    setForm((p) => {
      const imgs = [...p.images];
      imgs[idx] = { ...imgs[idx], caption };
      return { ...p, images: imgs };
    });

  /* 标签 */
  const toggleTag = (tag) => {
    const tags = form.tags.includes(tag)
      ? form.tags.filter((t) => t !== tag)
      : [...form.tags, tag];
    setForm((p) => ({ ...p, tags }));
  };

  /* 提交 */
  const submit = () => {
    if (!form.title.trim()) return;
    const entry = {
      ...form,
      id: Date.now(),
      title: form.title.trim(),
      date: formatNow(),
    };
    const next = [entry, ...records];
    setRecords(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setShowForm(false);
    setForm(emptyForm());
  };

  /* 删除 */
  const remove = (id) => {
    const next = records.filter((r) => r.id !== id);
    setRecords(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  /* ── 列表页 ── */
  if (!showForm) {
    return (
      <div style={container}>
        <div style={header}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={onBack} style={backBtn}>{'< back'}</button>
            <button onClick={() => { setForm(emptyForm()); setShowForm(true); }} style={plusBtn}>+</button>
          </div>
          <span style={{ fontSize: 18, letterSpacing: '1px', color: '#e8e0d0' }}>🎮 游戏</span>
          <div />
        </div>

        <div style={body}>
          {records.length === 0 ? (
            <div style={emptyState}>
              暂无记录<br />点击左上角 + 添加游戏推荐
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {records.map((r) => (
                <div key={r.id} style={card}>
                  {r.images?.length > 0 && (
                    <div style={{ flex: '0 0 120px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {r.images.map((img, i) => (
                        <div key={i}>
                          <img src={img.data} alt="" style={cardImg} />
                          {img.caption && (
                            <div style={{ fontSize: 11, color: 'rgba(232,224,208,0.4)', marginTop: 4, textAlign: 'center' }}>
                              {img.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* 标题行 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: '0.5px' }}>{r.title}</span>
                      <span style={getPlatformBadge(r.platform)}>{r.platform}</span>
                    </div>

                    {/* 标签 */}
                    {r.tags?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                        {r.tags.map((t) => (
                          <span key={t} style={cardTag}>{t}</span>
                        ))}
                      </div>
                    )}

                    {/* 状态 + 评分 */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' }}>
                      <span style={getStatusBadge(r.status)}>
                        {STATUS_OPTIONS.find((s) => s.value === r.status)?.label || r.status}
                      </span>
                      {r.rating > 0 && (
                        <span style={ratingBadge}>
                          {'★'.repeat(r.rating)}{'☆'.repeat(10 - r.rating)} {r.rating}/10
                        </span>
                      )}
                    </div>

                    {/* 游玩时长 */}
                    {r.playTime && (
                      <div style={{ fontSize: 12, color: 'rgba(232,224,208,0.35)', marginBottom: 6 }}>
                        🕒 {r.playTime}
                      </div>
                    )}

                    {/* 存档笔记 */}
                    {r.saveNotes && (
                      <div style={{
                        fontSize: 13, color: 'rgba(232,224,208,0.5)',
                        marginBottom: 8, fontStyle: 'italic',
                        borderLeft: '2px solid rgba(232,224,208,0.1)',
                        paddingLeft: 10,
                      }}>
                        💾 {r.saveNotes}
                      </div>
                    )}

                    {/* 评价 */}
                    <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {r.comment}
                    </div>

                    {/* 底部 */}
                    <div style={cardFooter}>
                      <span style={{ color: 'rgba(232,224,208,0.2)' }}>{r.date}</span>
                      <button onClick={() => remove(r.id)} style={delBtn}>删除</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── 新建表单 ── */
  return (
    <div style={container}>
      <div style={header}>
        <button onClick={() => { setShowForm(false); setForm(emptyForm()); }} style={backBtn}>
          {'< back'}
        </button>
        <span style={{ fontSize: 18, letterSpacing: '1px', color: '#e8e0d0' }}>
          推荐新游戏
        </span>
        <div />
      </div>

      <div style={{ ...body, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ── 游戏名称 ── */}
        <div>
          <div style={LABEL_STYLE}>游戏名称</div>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="输入游戏名称…"
            style={inputStyle}
          />
        </div>

        {/* ── 平台 ── */}
        <div>
          <div style={LABEL_STYLE}>平台</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PLATFORM_OPTIONS.map((p) => (
              <span
                key={p}
                onClick={() => setForm((prev) => ({ ...prev, platform: prev.platform === p ? '' : p }))}
                style={{
                  ...platformChip,
                  backgroundColor: form.platform === p ? 'rgba(232,224,208,0.15)' : 'rgba(255,255,255,0.04)',
                  color: form.platform === p ? '#e8e0d0' : 'rgba(232,224,208,0.45)',
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* ── 状态 ── */}
        <div>
          <div style={LABEL_STYLE}>状态</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map((s) => (
              <span
                key={s.value}
                onClick={() => setForm((p) => ({ ...p, status: s.value }))}
                style={{
                  ...statusChip,
                  backgroundColor: form.status === s.value ? s.color + '22' : 'rgba(255,255,255,0.04)',
                  borderColor: form.status === s.value ? s.color : 'rgba(255,255,255,0.1)',
                  color: form.status === s.value ? s.color : 'rgba(232,224,208,0.45)',
                }}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── 评分 ── */}
        <div>
          <div style={LABEL_STYLE}>评分</div>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                onClick={() => setForm((p) => ({ ...p, rating: i + 1 }))}
                style={{
                  cursor: 'pointer', fontSize: 26,
                  color: i < form.rating ? '#ffd700' : 'rgba(255,255,255,0.12)',
                  textShadow: i < form.rating ? '0 0 8px rgba(255,215,0,0.35)' : 'none',
                  transition: 'color 0.15s',
                }}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        {/* ── 游玩时长 ── */}
        <div>
          <div style={LABEL_STYLE}>游玩时长</div>
          <input
            value={form.playTime}
            onChange={(e) => setForm((p) => ({ ...p, playTime: e.target.value }))}
            placeholder="如：40 小时 / 二周目中…"
            style={inputStyle}
          />
        </div>

        {/* ── 标签 ── */}
        <div>
          <div style={LABEL_STYLE}>类型标签</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {allTags.map((t) => (
              <span
                key={t}
                onClick={() => toggleTag(t)}
                style={{
                  ...tagOption,
                  backgroundColor: form.tags.includes(t) ? 'rgba(232,224,208,0.15)' : 'transparent',
                  color: form.tags.includes(t) ? '#e8e0d0' : 'rgba(232,224,208,0.35)',
                }}
              >
                {form.tags.includes(t) ? '✓ ' : '+ '}{t}
              </span>
            ))}
          </div>
          <input
            value={form.newTag || ''}
            onChange={(e) => setForm((p) => ({ ...p, newTag: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && form.newTag?.trim()) {
                e.preventDefault();
                const tag = form.newTag.trim();
                if (!form.tags.includes(tag)) {
                  setForm((p) => ({ ...p, tags: [...p.tags, tag], newTag: '' }));
                } else {
                  setForm((p) => ({ ...p, newTag: '' }));
                }
              }
            }}
            placeholder="新建标签后回车…"
            style={{ ...tagInput, marginTop: 8 }}
          />
        </div>

        {/* ── 存档笔记 ── */}
        <div>
          <div style={LABEL_STYLE}>存档笔记</div>
          <textarea
            value={form.saveNotes}
            onChange={(e) => setForm((p) => ({ ...p, saveNotes: e.target.value }))}
            placeholder="记录你的存档进度、注意事项、技巧心得…"
            style={{ ...inputStyle, height: 80, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        {/* ── 评价 ── */}
        <div>
          <div style={LABEL_STYLE}>推荐语 / 评价</div>
          <textarea
            value={form.comment}
            onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
            placeholder="写下你的游戏推荐或评测…"
            style={{ ...inputStyle, height: 140, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        {/* ── 图片 ── */}
        <div>
          <div style={LABEL_STYLE}>截图 / 封面</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.images.map((img, i) => (
              <div key={i} style={imgCard}>
                <div style={imgCardHeader}>
                  <span style={{ fontSize: 11, color: 'rgba(232,224,208,0.3)' }}>#{i + 1}</span>
                  <button onClick={() => removeImage(i)} style={imgDelBtn}>✕</button>
                </div>
                <img src={img.data} alt="" style={imgPreview} />
                <input
                  value={img.caption}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  placeholder="添加说明…"
                  style={dishInput}
                />
              </div>
            ))}
            <label style={addImgBtn}>
              + 添加图片
              <input type="file" accept="image/*" multiple onChange={addImages} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* ── 发布 ── */}
        <button onClick={submit} style={submitBtn}>
          发布
        </button>
      </div>
    </div>
  );
}

/* ── 辅助函数 ── */
function getStatusBadge(status) {
  const s = STATUS_OPTIONS.find((o) => o.value === status);
  return {
    fontSize: 12, padding: '2px 10px', borderRadius: 6,
    backgroundColor: (s?.color || '#888') + '22',
    color: s?.color || '#888',
  };
}

function getPlatformBadge(platform) {
  return {
    fontSize: 11, padding: '2px 8px', borderRadius: 4,
    backgroundColor: 'rgba(232,224,208,0.08)',
    color: 'rgba(232,224,208,0.5)',
    letterSpacing: '0.5px',
  };
}

/* ── 样式常量 ── */
const LABEL_STYLE = {
  marginBottom: 8, color: 'rgba(232,224,208,0.55)', fontSize: '13px', letterSpacing: '1px',
};

const inputStyle = {
  width: '100%', padding: '12px 16px', boxSizing: 'border-box',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  color: '#e8e0d0', fontSize: 15, fontFamily: 'inherit', outline: 'none',
};

const container = {
  position: 'fixed', inset: 0, zIndex: 100,
  display: 'flex', flexDirection: 'column',
  fontFamily: "'Special Elite', 'Courier New', monospace",
  backgroundColor: 'rgba(10, 10, 10, 0.88)',
  backdropFilter: 'blur(14px)', color: '#e8e0d0',
};

const header = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const backBtn = {
  background: 'none', border: 'none',
  color: 'rgba(232,224,208,0.45)', cursor: 'pointer', fontSize: 14,
  fontFamily: 'inherit', letterSpacing: '1px', padding: 0,
};

const plusBtn = {
  width: 32, height: 32, borderRadius: '50%',
  border: '1.5px solid rgba(232,224,208,0.35)',
  backgroundColor: 'rgba(255,255,255,0.05)',
  color: '#e8e0d0', cursor: 'pointer', fontSize: 18,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit', lineHeight: 1,
};

const body = {
  flex: 1, overflow: 'auto', padding: 24,
  maxWidth: 700, width: '100%', margin: '0 auto', boxSizing: 'border-box',
};

const emptyState = {
  textAlign: 'center', padding: '80px 0',
  color: 'rgba(232,224,208,0.25)', fontSize: 14,
  letterSpacing: '1px', lineHeight: 1.8,
};

const card = {
  display: 'flex', gap: 18,
  backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14,
  padding: 18, border: '1px solid rgba(255,255,255,0.05)',
};

const cardImg = { width: 120, height: 90, borderRadius: 8, objectFit: 'cover' };

const ratingBadge = {
  fontSize: 12, padding: '2px 10px', borderRadius: 6,
  backgroundColor: 'rgba(255,215,0,0.08)', color: '#ffd700',
  letterSpacing: '1px',
};

const cardFooter = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginTop: 10, fontSize: 11, color: 'rgba(232,224,208,0.2)',
};

const delBtn = {
  background: 'none', border: 'none',
  color: 'rgba(232,224,208,0.2)', cursor: 'pointer',
  fontSize: 11, fontFamily: 'inherit', padding: 0,
};

const submitBtn = {
  padding: '12px 0', backgroundColor: 'rgba(232,224,208,0.85)',
  color: '#1a1a1a', border: 'none', borderRadius: 10,
  fontSize: 15, fontFamily: 'inherit', cursor: 'pointer', letterSpacing: '2px',
};

/* 平台/状态选择 */
const platformChip = {
  cursor: 'pointer', fontSize: 12, padding: '6px 14px', borderRadius: 8,
  border: '1px solid rgba(232,224,208,0.1)', letterSpacing: '0.5px',
  transition: 'all 0.15s',
};

const statusChip = {
  cursor: 'pointer', fontSize: 12, padding: '6px 14px', borderRadius: 20,
  border: '1px solid transparent', letterSpacing: '0.5px',
  transition: 'all 0.15s',
};

/* 标签 */
const tagOption = {
  cursor: 'pointer', fontSize: 12, padding: '2px 8px', borderRadius: 12,
  border: '1px solid rgba(232,224,208,0.1)', letterSpacing: '0.5px',
  transition: 'all 0.15s',
};

const cardTag = {
  fontSize: 11, padding: '2px 10px', borderRadius: 12,
  backgroundColor: 'rgba(232,224,208,0.07)',
  color: 'rgba(232,224,208,0.5)', letterSpacing: '0.5px',
};

const tagInput = {
  width: '100%', padding: '8px 12px', boxSizing: 'border-box',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
  color: '#e8e0d0', fontSize: 13, fontFamily: 'inherit', outline: 'none',
};

/* 图片相关 */
const imgCard = {
  backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
};

const imgCardHeader = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px',
};

const imgDelBtn = {
  background: 'none', border: 'none', color: 'rgba(232,224,208,0.25)',
  cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0, lineHeight: 1,
};

const imgPreview = { width: '100%', height: 180, objectFit: 'cover', display: 'block' };

const dishInput = {
  width: '100%', padding: '8px 10px', boxSizing: 'border-box',
  backgroundColor: 'rgba(255,255,255,0.04)', border: 'none',
  borderTop: '1px solid rgba(255,255,255,0.06)',
  color: '#e8e0d0', fontSize: 13, fontFamily: 'inherit',
  outline: 'none', textAlign: 'center', letterSpacing: '0.5px',
};

const addImgBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '14px 0', border: '2px dashed rgba(255,255,255,0.12)', borderRadius: 12,
  cursor: 'pointer', color: 'rgba(232,224,208,0.4)',
  fontSize: 14, fontFamily: 'inherit', letterSpacing: '1px',
};
