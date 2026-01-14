import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  MessageSquare,
  CheckSquare,
  AlertTriangle,
  Calendar,
  Settings,
  Home,
  ChevronRight,
  Search,
  Bell,
  Command,
  User,
  FileText,
  Zap,
  LayoutGrid,
  Sparkles,
  PieChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CommandMenu } from './CommandMenu';

const globalNav = [
  { id: 'home', icon: Home, href: '/', label: 'Home' },
  { id: 'chat', icon: MessageSquare, href: '/chat', label: 'Nora AI' },
  { id: 'inbox', icon: Inbox, href: '/inbox', label: 'Inbox' },
  { id: 'docs', icon: FileText, href: '/documents', label: 'Vault' },
  { id: 'settings', icon: Settings, href: '/settings', label: 'Settings' },
];

const workspaceGroups = [
  {
    title: 'Intelligence',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutGrid },
      { name: 'Analytics', href: '/analytics', icon: PieChart },
    ]
  },
  {
    title: 'Workflow',
    items: [
      { name: 'Inbox', href: '/inbox', icon: Inbox },
      { name: 'Tasks', href: '/tasks', icon: CheckSquare },
      { name: 'Obligations', href: '/obligations', icon: AlertTriangle },
    ]
  },
  {
    title: 'Schedule',
    items: [
      { name: 'Deadlines', href: '/deadlines', icon: Calendar },
      { name: 'Events', href: '/events', icon: Calendar },
    ]
  },
  {
    title: 'Resources',
    items: [
      { name: 'People', href: '/people', icon: User },
      { name: 'Documents', href: '/documents', icon: FileText },
    ]
  }
];

export function Layout() {
  const location = useLocation();
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#050505] text-white selection:bg-indigo-500/30 overflow-hidden font-sans">
      <CommandMenu isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      {/* Global Apps Strip (Narrow) */}
      <aside className="w-[72px] bg-[#0a0a0a] border-r border-white/5 flex flex-col items-center py-6 z-30">
        <Link to="/" className="mb-8 relative group">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
            <div className="h-full w-full bg-black rounded-[10px] flex items-center justify-center">
              <span className="text-xl font-black italic tracking-tighter text-white">N</span>
            </div>
          </div>
          <div className="absolute -inset-1 bg-indigo-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <div className="flex-1 flex flex-col gap-4">
          {globalNav.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.id}
                to={item.href}
                className={cn(
                  "relative h-12 w-12 flex items-center justify-center rounded-2xl transition-all duration-300 group",
                  isActive ? "bg-indigo-500/10 text-indigo-400" : "text-white/20 hover:text-white/40 hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="global-active"
                    className="absolute -left-[72px] w-1 h-6 bg-indigo-500 rounded-r-full"
                    animate={{ left: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive && "fill-indigo-400/10")} />

                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-2 py-1 rounded bg-white text-black text-[10px] font-bold opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/40 overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-colors">
            K
          </div>
        </div>
      </aside>

      {/* Contextual Sidebar (Wider) */}
      <aside className="w-64 bg-[#0a0a0a]/50 backdrop-blur-2xl border-r border-white/5 flex flex-col relative z-20 overflow-hidden shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Workspace</h2>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/20 hover:text-white">
              <Sparkles className="h-3 w-3" />
            </Button>
          </div>

          <nav className="space-y-8 flex-1 overflow-y-auto no-scrollbar pr-2">
            {workspaceGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#444]">{group.title}</h3>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                          isActive
                            ? "bg-white/5 text-white shadow-[0_1px_rgba(255,255,255,0.05)]"
                            : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                        )}
                      >
                        <item.icon className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          isActive ? "text-indigo-400" : "group-hover:text-white/50"
                        )} />
                        <span className="flex-1">{item.name}</span>
                        {isActive && <ChevronRight className="h-3 w-3 opacity-30" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Processing</span>
                <span className="text-[10px] font-black text-indigo-400">67%</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '67%' }}
                  className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => setIsCommandOpen(true)}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-hover:text-indigo-400 transition-colors" />
              <div className="bg-white/5 border border-white/5 rounded-2xl py-2 pl-10 pr-12 text-xs w-80 text-white/20 select-none shadow-inner group-hover:bg-white/[0.08] transition-all">
                Search everything... (⌘ K)
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-sans border border-white/5 text-white/40">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-sans border border-white/5 text-white/40">K</kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center -space-x-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-7 w-7 rounded-full border-2 border-[#050505] bg-gradient-to-br from-indigo-500 to-purple-500 p-0.5">
                  <div className="h-full w-full rounded-full bg-black flex items-center justify-center text-[8px] font-bold">N</div>
                </div>
              ))}
              <div className="h-7 w-7 rounded-full border-2 border-[#050505] bg-white/10 flex items-center justify-center text-[10px] text-white/40">+1</div>
            </div>

            <div className="h-6 w-px bg-white/5 mx-2" />

            <Button variant="ghost" size="icon" className="relative h-9 w-9 text-white/40 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-black" />
            </Button>

            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 rounded-xl shadow-lg shadow-indigo-500/20 gap-2">
              <Zap className="h-3.5 w-3.5 fill-current" />
              Ask Nora
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.99, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="p-10 max-w-[1400px] mx-auto w-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* Premium Decorative Lighting */}
      <div className="fixed top-0 right-0 w-[800px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 -z-10 pointer-events-none animate-pulse" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/5 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2 -z-10 pointer-events-none" />
    </div>
  );
}
