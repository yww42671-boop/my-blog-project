import { useState, useRef, useCallback } from 'react';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * 地理编码 Hook —— 通过 Nominatim (OpenStreetMap) 搜索地点名称，
 * 返回经纬度候选列表。
 *
 * 用法：
 *   const { results, loading, error, search, clear } = useGeocode();
 *   search('京都');        // 触发搜索（800ms 防抖）
 *   clear();               // 清除结果
 */
export default function useGeocode() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const search = useCallback((query) => {
    /* 清除上次的定时器 */
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    timerRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: query.trim(),
          format: 'json',
          limit: 5,
          'accept-language': 'zh',
        });
        const res = await fetch(`${NOMINATIM_URL}?${params}`, {
          headers: { 'User-Agent': 'MyBlogTravelApp/1.0' },
        });
        if (!res.ok) throw new Error(`地理编码请求失败 (${res.status})`);
        const data = await res.json();
        setResults(data);
      } catch (err) {
        setError(err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 800);
  }, []);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setResults([]);
    setError(null);
    setLoading(false);
  }, []);

  return { results, loading, error, search, clear };
}
