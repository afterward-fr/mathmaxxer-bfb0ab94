import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (customShortcuts?: ShortcutConfig[]) => {
  const navigate = useNavigate();

  const defaultShortcuts: ShortcutConfig[] = [
    {
      key: "h",
      altKey: true,
      action: () => navigate("/"),
      description: "Go to Home",
    },
    {
      key: "p",
      altKey: true,
      action: () => navigate("/practice"),
      description: "Go to Practice",
    },
    {
      key: "m",
      altKey: true,
      action: () => navigate("/multiplayer"),
      description: "Go to Multiplayer",
    },
    {
      key: "l",
      altKey: true,
      action: () => navigate("/leaderboard"),
      description: "Go to Leaderboard",
    },
    {
      key: "t",
      altKey: true,
      action: () => navigate("/tournaments"),
      description: "Go to Tournaments",
    },
    {
      key: "c",
      altKey: true,
      action: () => navigate("/clans"),
      description: "Go to Clans",
    },
    {
      key: "a",
      altKey: true,
      action: () => navigate("/analytics"),
      description: "Go to Analytics",
    },
    {
      key: "f",
      altKey: true,
      action: () => navigate("/friends"),
      description: "Go to Friends",
    },
    {
      key: "s",
      altKey: true,
      action: () => navigate("/settings"),
      description: "Go to Settings",
    },
  ];

  const shortcuts = [...defaultShortcuts, ...(customShortcuts || [])];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.altKey ? event.altKey : !event.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
};

export const getShortcutLabel = (shortcut: ShortcutConfig): string => {
  const parts: string[] = [];
  if (shortcut.ctrlKey) parts.push("Ctrl");
  if (shortcut.altKey) parts.push("Alt");
  if (shortcut.shiftKey) parts.push("Shift");
  parts.push(shortcut.key.toUpperCase());
  return parts.join(" + ");
};

export default useKeyboardShortcuts;
