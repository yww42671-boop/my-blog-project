import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook that reveals text one character at a time.
 * @param {string} text - The full text to type out
 * @param {number} speed - Milliseconds per character (default 38)
 * @param {number} startDelay - Delay before typing starts in ms (default 600)
 * @returns {{ displayed: string, done: boolean }}
 */
export default function useTypewriter(text, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Reset when text changes
    setDisplayed('');
    setDone(false);
    indexRef.current = 0;

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        if (indexRef.current < text.length) {
          indexRef.current += 1;
          setDisplayed(text.slice(0, indexRef.current));
        } else {
          setDone(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, speed);
    }, startDelay);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}
