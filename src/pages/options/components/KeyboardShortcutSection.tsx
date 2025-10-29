import type { JSX } from 'react';
import { useEffect, useState } from 'react';

type Command = chrome.commands.Command;

export function KeyboardShortcutSection(): JSX.Element {
  const [commands, setCommands] = useState<Command[]>([]);

  useEffect(() => {
    const fetchCommands = async () => {
      if (chrome.commands) {
        const fetchedCommands = await chrome.commands.getAll();
        setCommands(fetchedCommands);
      }
    };
    void fetchCommands();
  }, []);

  const handleChangeClick = () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  };

  return (
    <section className="flex flex-col gap-3 rounded-[24px] border border-[rgba(148,163,184,0.25)] bg-[rgba(255,255,255,0.6)] p-6 text-[#475569]">
      <h3 className="text-lg font-bold text-[#334155]">キーボードショートカット</h3>
      <div className="flex flex-col gap-2">
        {commands.map((command) => (
          <div key={command.name} className="flex items-center justify-between">
            <p className="text-sm">{command.description}</p>
            <div className="flex items-center gap-4">
              <kbd className="rounded-md border bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-800">
                {command.shortcut || '未設定'}
              </kbd>
              <button
                type="button"
                onClick={handleChangeClick}
                className="rounded-md bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              >
                変更
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
