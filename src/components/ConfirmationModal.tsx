import React from 'react';
import { AgentStep, AgentRun } from '../types';
import { AlertTriangle, ShieldAlert, Check, X, Terminal, FileEdit } from 'lucide-react';

interface ConfirmationModalProps {
  pending: {
    step: AgentStep;
    run: AgentRun;
  } | null;
  onRespond: (approved: boolean) => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  pending,
  onRespond,
}) => {
  if (!pending) return null;

  const { step, run } = pending;
  const isCommand = step.tool === 'shell_execute';
  const isFile = step.tool.startsWith('file_');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              Authorization Required
            </h3>
            <p className="text-xs text-amber-400/90 font-medium">
              VISP Autonomous Agent requires your confirmation
            </p>
          </div>
        </div>

        {/* Task description */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="text-xs text-slate-400 uppercase font-mono tracking-wider">
            Overall Task Goal
          </div>
          <div className="text-sm text-slate-200 font-medium">
            "{run.prompt}"
          </div>
        </div>

        {/* Step details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Action Step #{step.stepNumber}:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {step.tool}
            </span>
          </div>

          <div className="text-sm font-semibold text-slate-100">
            {step.action}
          </div>

          {/* Target payload viewer */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 max-h-32 overflow-y-auto">
            {isCommand && (
              <div className="flex items-start gap-2 text-cyan-400">
                <Terminal className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
                <span className="break-all">{step.input.command}</span>
              </div>
            )}
            {isFile && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-400">
                  <FileEdit className="w-4 h-4 text-slate-500" />
                  <span>Path: {step.input.path}</span>
                </div>
                {step.input.content && (
                  <div className="text-slate-400 text-[11px] truncate">
                    Content preview: {step.input.content.slice(0, 120)}...
                  </div>
                )}
              </div>
            )}
            {!isCommand && !isFile && (
              <pre>{JSON.stringify(step.input, null, 2)}</pre>
            )}
          </div>
        </div>

        {/* Warning banner */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300/90">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>
            This action will interact with your system. Review the command or file operation before approving.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => onRespond(false)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
            Deny & Abort
          </button>
          <button
            onClick={() => onRespond(true)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 transition"
          >
            <Check className="w-4 h-4" />
            Authorize Execution
          </button>
        </div>
      </div>
    </div>
  );
};
