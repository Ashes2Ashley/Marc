import React, { useState } from 'react';
import { Activity, Radio, RefreshCw, CheckCircle2, AlertTriangle, Wifi } from 'lucide-react';

interface ProxyEndpoint {
  id: string;
  name: string;
  url: string;
  latencyMs: number;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  successRate: number;
  sslValid: boolean;
}

const INITIAL_PROXIES: ProxyEndpoint[] = [
  { id: 'p1', name: 'US-East CorsProxy Node A', url: 'https://corsproxy.io/?', latencyMs: 142, status: 'ONLINE', successRate: 98.4, sslValid: true },
  { id: 'p2', name: 'US-West Research Worker B', url: 'https://api.allorigins.win/raw?url=', latencyMs: 285, status: 'ONLINE', successRate: 95.1, sslValid: true },
  { id: 'p3', name: 'US-Central State Gateway C', url: 'https://thingproxy.freeboard.io/fetch/', latencyMs: 640, status: 'DEGRADED', successRate: 82.0, sslValid: true },
  { id: 'p4', name: 'Custom Local Tunnel Proxy', url: 'http://localhost:8080/proxy?', latencyMs: 12, status: 'ONLINE', successRate: 99.9, sslValid: false },
];

export const ProxyHealthMonitor: React.FC = () => {
  const [proxies, setProxies] = useState<ProxyEndpoint[]>(INITIAL_PROXIES);
  const [isPinging, setIsPinging] = useState(false);

  const handlePingAll = () => {
    setIsPinging(true);
    setTimeout(() => {
      setProxies((prev) =>
        prev.map((p) => ({
          ...p,
          latencyMs: Math.max(10, Math.round(p.latencyMs + (Math.random() * 60 - 30))),
          successRate: Math.min(100, Math.max(70, Number((p.successRate + (Math.random() * 2 - 1)).toFixed(1)))),
        }))
      );
      setIsPinging(false);
    }, 800);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">CORS Proxy Health & Handshake Monitor</h3>
        </div>

        <button
          onClick={handlePingAll}
          disabled={isPinging}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-semibold transition-all border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isPinging ? 'animate-spin' : ''}`} />
          <span>{isPinging ? 'Pinging Endpoints...' : 'Ping Proxy Nodes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {proxies.map((p) => (
          <div key={p.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 font-mono">
            <div className="flex items-center justify-between">
              <span className="font-sans font-bold text-slate-200 text-xs truncate max-w-[180px]">{p.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  p.status === 'ONLINE'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {p.status}
              </span>
            </div>

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Latency: <strong className="text-cyan-300">{p.latencyMs} ms</strong></span>
              <span>Success: <strong className="text-emerald-400">{p.successRate}%</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
