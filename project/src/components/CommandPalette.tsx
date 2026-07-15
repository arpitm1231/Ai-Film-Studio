import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  BookOpen,
  FileText,
  Image,
  Music,
  Video,
  BarChart3,
  FolderOpen,
  Plus,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  icon: typeof BookOpen;
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (stage: string) => void;
  onNewProject: () => void;
  projectName: string;
}

export default function CommandPalette({ open, onClose, onNavigate, onNewProject, projectName }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    { id: 'projects', label: 'Go to Projects', icon: FolderOpen, category: 'Navigate', action: () => { onNavigate('projects'); onClose(); } },
    { id: 'new-project', label: 'Create New Project', icon: Plus, category: 'Actions', action: () => { onNewProject(); onClose(); } },
    ...(projectName
      ? [
          { id: 'story', label: 'Go to Story', icon: BookOpen, category: 'Navigate', action: () => { onNavigate('story'); onClose(); } },
          { id: 'script', label: 'Go to Script', icon: FileText, category: 'Navigate', action: () => { onNavigate('script'); onClose(); } },
          { id: 'visuals', label: 'Go to Visuals', icon: Image, category: 'Navigate', action: () => { onNavigate('visuals'); onClose(); } },
          { id: 'audio', label: 'Go to Audio', icon: Music, category: 'Navigate', action: () => { onNavigate('audio'); onClose(); } },
          { id: 'trailer', label: 'Go to Trailer', icon: Video, category: 'Navigate', action: () => { onNavigate('trailer'); onClose(); } },
          { id: 'analytics', label: 'Go to Analytics', icon: BarChart3, category: 'Navigate', action: () => { onNavigate('analytics'); onClose(); } },
          { id: 'gen-script', label: 'Generate Screenplay', icon: Sparkles, category: 'Generate', action: () => { onNavigate('script'); onClose(); } },
          { id: 'gen-visuals', label: 'Generate Visuals', icon: Sparkles, category: 'Generate', action: () => { onNavigate('visuals'); onClose(); } },
          { id: 'gen-audio', label: 'Generate Audio', icon: Sparkles, category: 'Generate', action: () => { onNavigate('audio'); onClose(); } },
          { id: 'gen-trailer', label: 'Compose Trailer', icon: Sparkles, category: 'Generate', action: () => { onNavigate('trailer'); onClose(); } },
          { id: 'gen-analytics', label: 'Generate Analytics', icon: Sparkles, category: 'Generate', action: () => { onNavigate('analytics'); onClose(); } },
        ]
      : []),
  ];

  const filtered = query
    ? commands.filter(
        (c) => c.label.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  useEffect(() => { setSelectedIndex(0); }, [query]);

  useEffect(() => {
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter' && filtered[selectedIndex]) { e.preventDefault(); filtered[selectedIndex].action(); }
      else if (e.key === 'Escape') { onClose(); }
    },
    [filtered, selectedIndex, onClose]
  );

  if (!open) return null;

  const categories = [...new Set(filtered.map((c) => c.category))];

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[15vh] p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg cinema-card overflow-hidden shadow-2xl animate-scale-in"
        onKeyDown={handleKeyDown}
      >
        <div className="relative z-10">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-amber-500/[0.06]">
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="w-full bg-transparent py-4 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded border border-amber-500/[0.06]">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto p-2">
            {categories.map((category) => (
              <div key={category}>
                <p className="px-2 py-1.5 text-[9px] uppercase tracking-[0.25em] text-amber-400/30 font-semibold">
                  {category}
                </p>
                {filtered
                  .filter((c) => c.category === category)
                  .map((cmd) => {
                    const Icon = cmd.icon;
                    const idx = filtered.indexOf(cmd);
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          idx === selectedIndex
                            ? 'bg-amber-500/[0.08] text-amber-400 border border-amber-500/10'
                            : 'text-slate-300 hover:bg-slate-800/50 border border-transparent'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm flex-1">{cmd.label}</span>
                        {idx === selectedIndex && <ArrowRight className="w-3 h-3 text-amber-400" />}
                      </button>
                    );
                  })}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">No commands found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-amber-500/[0.06] text-[10px] text-slate-600">
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800/50 px-1 py-0.5 rounded border border-amber-500/[0.06]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800/50 px-1 py-0.5 rounded border border-amber-500/[0.06]">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800/50 px-1 py-0.5 rounded border border-amber-500/[0.06]">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
