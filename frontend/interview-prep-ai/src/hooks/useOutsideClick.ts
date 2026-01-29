import { useEffect, RefObject } from "react";

/**
 * Hook that alerts clicks outside of the passed ref
 * @param ref The ref of the element to detect clicks outside of
 * @param callback The function to call when a click outside is detected
 */
export const useOutsideClick = (
  ref: RefObject<HTMLElement | null>,
  callback: () => void,
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
};
