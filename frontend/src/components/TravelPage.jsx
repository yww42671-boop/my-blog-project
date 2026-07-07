import { useState } from 'react';
import GlobeView from './GlobeView';
import useGeocode from '../hooks/useGeocode';

const STORAGE_KEY = 'travel_records';

/* ─── 数据工具 ─── */
function loadRecords() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function formatNow() {
  const d = new Date();
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/* ─── 所有已标记的地点（去重） ─── */
function getPlaces(records) {
  const map = {};
  records.forEach((r) => {
    if (r.placeName && !map[r.placeName]) {
      map[r.placeName] = { placeName: r.placeName, lat: r.lat, lng: r.lng };
    }
  });
  return Object.values(map);
}

/* ─── 样式常量 ─── */
const container = {
  position: 'fixed', inset: 0, zIndex: 100,
  display: 'flex', flexDirection: 'column',
  fontFamily: "'Special Elite', 'Courier New', monospace",
  backgroundColor: 'rgba(5, 5, 15, 0.92)',
  backdropFilter: 'blur(14px)',
  color: '#e8e0d0',
};

const header = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '14px 24px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const backBtn = {
  background: 'none', border: 'none',
  color: 'rgba(232,224,208,0.45)',
  cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
  letterSpacing: '1px', padding: 0, whiteSpace: 'nowrap',
};

const searchInput = {
  flex: 1, padding: '10px 16px',
  backgroundColor: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: '#e8e0d0',
  fontSize: 15, fontFamily: 'inherit', outline: 'none',
  letterSpacing: '0.5px',
};

const LABEL_STYLE = {
  marginBottom: 8,
  color: 'rgba(232,224,208,0.55)',
  fontSize: '13px',
  letterSpacing: '1px',
};

const inputStyle = {
  width: '100%', padding: '12px 16px',
  boxSizing: 'border-box',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  color: '#e8e0d0', fontSize: 15, fontFamily: 'inherit', outline: 'none',
};

/* ─── 主页组件 ─── */
export default function TravelPage({ onBack }) {
  const [records, setRecords] = useState(loadRecords);
  const [view, setView] = useState('globe');   // globe | records | new
  const [search, setSearch] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);

  const places = getPlaces(records);

  /* 搜索处理 */
  const handleSearch = () => {
    const q = search.trim();
    if (!q) return;
    const match = places.find((p) => p.placeName.includes(q));
    if (match) {
      setSelectedPlace(match.placeName);
      setView('records');
    } else {
      setSelectedPlace(q);
      setView('new');
    }
  };

  const handleSearchKey = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  /* 点击地球上的标记 */
  const handleGlobeClick = (placeName) => {
    setSelectedPlace(placeName);
    setSearch(placeName);
    setView('records');
  };

  /* 从搜索结果点击 "添加记录" */
  const handleAddNew = () => {
    setView('new');
  };

  /* 提交新记录 */
  const submitRecord = (form) => {
    const entry = {
      ...form,
      id: Date.now(),
      images: form.images || [],
      date: formatNow(),
    };
    const next = [entry, ...records];
    setRecords(next);
    saveRecords(next);
    setView('records');
  };

  /* 删除记录 */
  const deleteRecord = (id) => {
    const next = records.filter((r) => r.id !== id);
    setRecords(next);
    saveRecords(next);
  };

  /* ── Globe 主界面 ── */
  if (view === 'globe') {
    return (
      <div style={container}>
        <div style={header}>
          <button onClick={onBack} style={backBtn}>{'< back'}</button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder="搜索已标记的地点…"
            style={searchInput}
          />
          <button
            onClick={handleSearch}
            style={{
              ...backBtn, color: 'rgba(232,224,208,0.6)',
            }}
          >
            搜索
          </button>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <GlobeView markers={places} onPlaceClick={handleGlobeClick} />

          {/* 地点列表浮层 */}
          {places.length > 0 && (
            <div style={{
              position: 'absolute', right: 20, top: 20,
              backgroundColor: 'rgba(10,10,20,0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: 12, padding: '12px 16px',
              border: '1px solid rgba(255,255,255,0.06)',
              maxHeight: '40%', overflow: 'auto',
              minWidth: 140,
            }}>
              <div style={{ fontSize: 11, color: 'rgba(232,224,208,0.3)', marginBottom: 8, letterSpacing: '1px' }}>
                已标记
              </div>
              {places.map((p) => (
                <div
                  key={p.placeName}
                  onClick={() => handleGlobeClick(p.placeName)}
                  style={{
                    cursor: 'pointer', padding: '4px 0',
                    fontSize: 13, color: 'rgba(232,224,208,0.6)',
                    letterSpacing: '0.5px',
                  }}
                >
                  • {p.placeName}
                </div>
              ))}
            </div>
          )}

          {/* 底部提示 */}
          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            fontSize: 12, color: 'rgba(232,224,208,0.2)',
            letterSpacing: '1px', textAlign: 'center',
          }}>
            点击地球上的光点查看记录 · 上方搜索栏搜索地点
          </div>
        </div>
      </div>
    );
  }

  /* ── 某个地点的记录列表 ── */
  if (view === 'records') {
    const placeRecords = records.filter((r) => r.placeName === selectedPlace);

    return (
      <div style={container}>
        <div style={header}>
          <button onClick={() => { setView('globe'); setSearch(''); }} style={backBtn}>
            {'< back'}
          </button>
          <span style={{ fontSize: 16, letterSpacing: '1px' }}>
            🗺️ {selectedPlace}
          </span>
          <button onClick={handleAddNew} style={{
            width: 30, height: 30, borderRadius: '50%',
            border: '1.5px solid rgba(232,224,208,0.35)',
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: '#e8e0d0', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit', lineHeight: 1, marginLeft: 'auto',
          }}>+</button>
        </div>

        <div style={{
          flex: 1, overflow: 'auto', padding: 24,
          maxWidth: 700, width: '100%', margin: '0 auto',
          boxSizing: 'border-box',
        }}>
          {placeRecords.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '80px 0',
              color: 'rgba(232,224,208,0.25)', fontSize: 14,
              lineHeight: 2, letterSpacing: '1px',
            }}>
              暂无记录<br />
              点击右上角 + 添加第一篇游记
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {placeRecords.map((r) => (
                <div key={r.id} style={{
                  display: 'flex', flexDirection: 'column', gap: 12,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: 14, padding: 18,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  {/* 图片 */}
                  {r.images?.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {r.images.map((img, i) => (
                        <div key={i}>
                          <img
                            src={img.data}
                            alt=""
                            style={{ width: 120, height: 90, borderRadius: 8, objectFit: 'cover' }}
                          />
                          {img.caption && (
                            <div style={{ fontSize: 11, color: 'rgba(232,224,208,0.4)', marginTop: 2, textAlign: 'center' }}>
                              {img.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 内容 */}
                  <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {r.content}
                  </div>
                  {/* 底部 */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 11, color: 'rgba(232,224,208,0.2)',
                  }}>
                    <span>{r.date}</span>
                    <button onClick={() => deleteRecord(r.id)} style={{
                      background: 'none', border: 'none',
                      color: 'rgba(232,224,208,0.2)',
                      cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', padding: 0,
                    }}>删除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── 新建记录 ── */
  if (view === 'new') {
    const isUnknown = !places.find((p) => p.placeName === selectedPlace);

    return (
      <NewRecordForm
        defaultPlace={selectedPlace}
        isUnknown={isUnknown}
        onBack={() => {
          if (isUnknown) {
            setView('globe');
            setSearch('');
          } else {
            setView('records');
          }
        }}
        onSubmit={submitRecord}
      />
    );
  }
}

/* ─── 四级子界面：新记录表单（带地理编码搜索 + 地球预览） ─── */
function NewRecordForm({ defaultPlace, isUnknown, onBack, onSubmit }) {
  const [placeName, setPlaceName] = useState(defaultPlace || '');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [images, setImages] = useState([]);
  const [content, setContent] = useState('');

  /* 地理编码 */
  const { results, loading: geoLoading, error: geoError, search: geoSearch, clear: geoClear } = useGeocode();
  const [showResults, setShowResults] = useState(false);

  /* 预览坐标（选择结果后填充） */
  const [previewCoords, setPreviewCoords] = useState(null);

  const handlePlaceNameChange = (e) => {
    const val = e.target.value;
    setPlaceName(val);
    if (val.trim().length >= 2) {
      geoSearch(val);
      setShowResults(true);
    } else {
      geoClear();
      setShowResults(false);
    }
  };

  const selectResult = (item) => {
    const newLat = parseFloat(item.lat);
    const newLng = parseFloat(item.lon);
    setPlaceName(item.display_name.split(',')[0] || item.display_name);
    setLat(String(newLat));
    setLng(String(newLng));
    setPreviewCoords({ lat: newLat, lng: newLng, placeName: item.display_name.split(',')[0] || item.display_name });
    setShowResults(false);
    geoClear();
  };

  const addImages = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setImages((p) => [...p, { data: ev.target.result, caption: '' }]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (idx) =>
    setImages((p) => p.filter((_, i) => i !== idx));

  const updateCaption = (idx, caption) =>
    setImages((p) => {
      const imgs = [...p];
      imgs[idx] = { ...imgs[idx], caption };
      return imgs;
    });

  const handleSubmit = () => {
    if (!placeName.trim() || !content.trim()) return;
    onSubmit({
      placeName: placeName.trim(),
      lat: parseFloat(lat) || 0,
      lng: parseFloat(lng) || 0,
      images,
      content: content.trim(),
    });
  };

  return (
    <div style={container}>
      <div style={header}>
        <button onClick={onBack} style={backBtn}>{'< back'}</button>
        <span style={{ fontSize: 16, letterSpacing: '1px' }}>
          {isUnknown ? '🌍 未知领域' : '✏️ 添加记录'}
        </span>
        <div />
      </div>

      {isUnknown && (
        <div style={{
          textAlign: 'center', padding: '20px 0 0',
          color: 'rgba(232,224,208,0.3)', fontSize: 14, letterSpacing: '1px',
        }}>
          此地暂无记录 · 录入你的第一份足迹
        </div>
      )}

      <div style={{
        flex: 1, overflow: 'auto', padding: 24,
        maxWidth: 700, width: '100%', margin: '0 auto',
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* ── 地点名称 + 搜索 ── */}
          <div style={{ position: 'relative' }}>
            <div style={LABEL_STYLE}>地点名称</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={placeName}
                onChange={handlePlaceNameChange}
                onFocus={() => { if (results.length > 0) setShowResults(true); }}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                placeholder="输入地名自动搜索坐标，如：京都、巴黎、…"
                style={{ ...inputStyle, flex: 1 }} />
              {geoLoading && (
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'rgba(232,224,208,0.4)', fontSize: 18,
                  flexShrink: 0,
                }}>⟳</div>
              )}
            </div>

            {/* 搜索结果下拉 */}
            {showResults && results.length > 0 && (
              <div style={{
                position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4,
                backgroundColor: 'rgba(15,15,30,0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, overflow: 'hidden', zIndex: 50,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                {results.map((item, i) => (
                  <div key={item.osm_id || i}
                    onMouseDown={() => selectResult(item)}
                    style={{
                      padding: '10px 14px', cursor: 'pointer',
                      borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ fontSize: 14, color: '#e8e0d0', marginBottom: 2 }}>
                      {item.display_name.split(',')[0]}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(232,224,208,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.display_name} · {item.lat.slice(0, 7)}, {item.lon.slice(0, 7)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {geoError && (
              <div style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>
                搜索失败：{geoError}
              </div>
            )}
          </div>

          {/* ── 坐标 ── */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={LABEL_STYLE}>纬度</div>
              <input value={lat} onChange={(e) => { setLat(e.target.value); setPreviewCoords(null); }}
                placeholder="如：35.0116" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={LABEL_STYLE}>经度</div>
              <input value={lng} onChange={(e) => { setLng(e.target.value); setPreviewCoords(null); }}
                placeholder="如：135.7681" style={inputStyle} />
            </div>
          </div>

          {/* ── 地球预览（选择坐标后显示） ── */}
          {previewCoords && (
            <div style={{
              borderRadius: 14, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
              height: 260, position: 'relative',
            }}>
              <GlobeView markers={[]} previewMarker={previewCoords} />
              <div style={{
                position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                fontSize: 11, color: 'rgba(232,224,208,0.25)',
                letterSpacing: '0.5px', pointerEvents: 'none',
              }}>
                🎯 预览：{previewCoords.placeName}
              </div>
            </div>
          )}

          {/* ── 图片 ── */}
          <div>
            <div style={LABEL_STYLE}>图片</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {images.map((img, i) => (
                <div key={i} style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '4px 10px',
                  }}>
                    <span style={{ fontSize: 11, color: 'rgba(232,224,208,0.3)' }}>#{i + 1}</span>
                    <button onClick={() => removeImage(i)} style={{
                      background: 'none', border: 'none',
                      color: 'rgba(232,224,208,0.25)',
                      cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1,
                      fontFamily: 'inherit',
                    }}>✕</button>
                  </div>
                  <img src={img.data} alt="" style={{
                    width: '100%', height: 180, objectFit: 'cover', display: 'block',
                  }} />
                  <input value={img.caption} onChange={(e) => updateCaption(i, e.target.value)}
                    placeholder="添加图片说明…"
                    style={{
                      width: '100%', padding: '8px 10px', boxSizing: 'border-box',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)',
                      color: '#e8e0d0', fontSize: 12, fontFamily: 'inherit',
                      outline: 'none', textAlign: 'center',
                    }} />
                </div>
              ))}
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '12px 0',
                border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 10,
                cursor: 'pointer', color: 'rgba(232,224,208,0.35)',
                fontSize: 13, fontFamily: 'inherit', letterSpacing: '1px',
              }}>
                + 添加图片
                <input type="file" accept="image/*" multiple onChange={addImages} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* ── 游记 ── */}
          <div>
            <div style={LABEL_STYLE}>游记</div>
            <textarea value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="写下你的旅行故事…"
              style={{ ...inputStyle, height: 200, resize: 'vertical', lineHeight: 1.7 }} />
          </div>

          <button onClick={handleSubmit} style={{
            padding: '12px 0',
            backgroundColor: 'rgba(232,224,208,0.85)',
            color: '#1a1a1a', border: 'none', borderRadius: 10,
            fontSize: 15, fontFamily: 'inherit', cursor: 'pointer',
            letterSpacing: '2px',
          }}>
            发布
          </button>
        </div>
      </div>
    </div>
  );
}
