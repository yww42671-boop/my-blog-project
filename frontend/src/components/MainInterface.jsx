import { useState } from 'react';
import FoodPage from './FoodPage';
import TravelPage from './TravelPage';
import GamePage from './GamePage';

// 严格使用原坐标（基于 1920×1080 图片测量）
const ITEMS = [
  {
    key: 'tablet',     sub: 'read',   label: 'iPad',   emoji: '📱',
    x1: 25,  y1: -25,   x2: 335, y2: 435,
  },
  {
    key: 'notebook',   sub: 'notes',  label: 'NOTES',  emoji: '📓',
    x1: 452, y1: 343,  x2: 572, y2: 603,
  },
  {
    key: 'map',        sub: 'travel', label: '地图',    emoji: '🗺️',
    x1: -24, y1: 458,  x2: 152, y2: 758,
  },
  {
    key: 'cake',       sub: 'food',   label: '蛋糕',    emoji: '🍰',
    x1: 1579, y1: 748,  x2: 1749, y2: 1008,
  },
  {
    key: 'gamepad',    sub: 'game',   label: '手柄',    emoji: '🎮',
    x1: 966, y1: 513,  x2: 1146, y2: 683,
  },
  {
    key: 'camera',     sub: 'daily',  label: '相机',    emoji: '📷',
    x1: 1263, y1: -31,  x2: 1393, y2: 99,
  },
  {
    key: 'headphone',  sub: 'music',  label: '耳机',    emoji: '🎧',
    x1: 1269, y1: 84,  x2: 1419, y2: 204,
  },
];

const SUB_CONTENT = {
  food:    { title: '🍰 美食',   body: '烟火人间，风味长存。从街角酒肆到深夜手作，用舌尖刻录时间的厚度，给味蕾一场温柔的放逐。' },
  travel:  { title: '🗺️ 旅行',   body: '大地是本没有边际的诗集。捕捉风的方向，追逐地平线的暮色。这里是我与世界的每一次接头暗号。' },
  game:    { title: '🎮 游戏',   body: '光影编织的第九艺术。在这里，数字像素转化为史诗。记录每一次跨越次元的远征与博弈。' },
  daily:   { title: '📷 日常',   body: '把平凡的日子过成诗。用镜头捕捉转瞬即逝的光影，在细微处发现生活的温度。' },
  music:   { title: '🎧 音乐',   body: '旋律是流动的建筑。在音符的缝隙间，寻找灵魂的共鸣与共振。' },
  notes:   { title: '📓 NOTES',  body: '文字是思想的足迹。记录灵光乍现的瞬间，让每一个想法都有迹可循。' },
  read:    { title: '📱 阅读',   body: '书是随身携带的避难所。在字里行间漫游，与有趣的灵魂不期而遇。' },
};

// 将所有物品坐标统一转换为百分比的辅助函数
// 原坐标基于 1920×1080 测量
const toPct = (px, axis) => (axis === 'x' ? (px / 1920) * 100 : (px / 1080) * 100);

export default function MainInterface({ username, onLogout }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  if (selectedItem) {
    // 美食子页面
    if (selectedItem.sub === 'food') {
      return <FoodPage onBack={() => setSelectedItem(null)} />;
    }
    // 旅行子页面
    if (selectedItem.sub === 'travel') {
      return <TravelPage onBack={() => setSelectedItem(null)} />;
    }
    // 游戏子页面
    if (selectedItem.sub === 'game') {
      return <GamePage onBack={() => setSelectedItem(null)} />;
    }

    const content = SUB_CONTENT[selectedItem.sub];
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Special Elite', 'Courier New', monospace",
          backgroundColor: 'rgba(10, 10, 10, 0.6)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(20, 20, 20, 0.7)',
            backdropFilter: 'blur(18px)', borderRadius: '24px',
            padding: '40px 48px', maxWidth: '520px', width: '90%',
            boxShadow: '0 16px 64px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)', color: '#e8e0d0',
          }}
        >
          <button
            onClick={() => setSelectedItem(null)}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(232,224,208,0.5)', cursor: 'pointer',
              fontSize: '16px', fontFamily: 'inherit', padding: 0,
              marginBottom: '20px', letterSpacing: '1px',
            }}
          >
            {'< back to desk'}
          </button>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '28px', fontWeight: 400, fontFamily: 'inherit' }}>
            {content.title}
          </h2>
          <p style={{ lineHeight: '1.9', fontSize: '18px', color: '#c8c0b0' }}>{content.body}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      style={{
        position: 'fixed', inset: 0, zIndex: 5, overflow: 'hidden',
        fontFamily: "'Special Elite', 'Courier New', monospace",
        backgroundColor: '#000',
      }}
    >
      {/* Ring cursor — follows mouse when hovering an item */}
      {hoveredKey && (
        <div
          style={{
            position: 'fixed',
            left: mousePos.x - 24,
            top: mousePos.y - 24,
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '2.5px solid rgba(255,255,255,0.85)',
            boxShadow:
              '0 0 20px rgba(255,255,255,0.25), 0 0 60px rgba(255,255,255,0.08), inset 0 0 12px rgba(255,255,255,0.06)',
            pointerEvents: 'none',
            zIndex: 9999,
            transition: 'width 0.2s ease, height 0.2s ease, left 0.05s linear, top 0.05s linear',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.4)',
            }}
          />
        </div>
      )}

      {/* Desk background */}
      <img
        src="/sucai/maindesk.png"
        alt="Main Desk"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center',
          userSelect: 'none', pointerEvents: 'none',
        }}
      />

      {/* Top bar */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '16px 24px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          zIndex: 20,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', letterSpacing: '1px' }}>
          {'>'} {username}
        </span>
        <button onClick={onLogout} style={{
          padding: '6px 16px', backgroundColor: 'rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
          fontFamily: 'inherit', letterSpacing: '1px',
        }}>
          EXIT
        </button>
      </div>

      {/* Hotspots — 严格使用原坐标 */}
      {ITEMS.map((item) => {
        const isHover = hoveredKey === item.key;
        const pL = toPct(item.x1, 'x');
        const pT = toPct(item.y1, 'y');
        const pW = toPct(item.x2 - item.x1, 'x');
        const pH = toPct(item.y2 - item.y1, 'y');

        return (
          <div
            key={item.key}
            onMouseEnter={() => setHoveredKey(item.key)}
            onMouseLeave={() => setHoveredKey(null)}
            onClick={() => setSelectedItem(item)}
            style={{
              position: 'absolute',
              left: `${pL}%`,
              top: `${pT}%`,
              width: `${pW}%`,
              height: `${pH}%`,
              cursor: isHover ? 'none' : 'pointer',
              zIndex: isHover ? 15 : 10,
            }}
          >
          </div>
        );
      })}
    </div>
  );
}
