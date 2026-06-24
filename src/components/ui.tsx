import React from 'react';
import { cn } from '../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ className, hoverable = false, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "bg-white p-5 rounded-3xl border border-[#f1f3f7] shadow-[0_8px_30px_rgb(28,52,106,0.02)] transition-all duration-300",
        hoverable && "hover:shadow-[0_12px_40px_rgb(28,52,106,0.05)] hover:-translate-y-0.5",
        className
      )} 
      {...props} />
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  const variants = {
    primary: "bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-[0_4px_16px_rgba(37,99,235,0.15)] font-semibold tracking-wide border border-transparent",
    secondary: "bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1e40af] font-semibold border border-transparent",
    outline: "bg-white border-2 border-[#e2e8f0] text-stone-600 hover:bg-stone-50 hover:border-stone-300 font-semibold",
    ghost: "bg-transparent text-[#2563eb] hover:bg-[#f0f9ff] font-semibold",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold",
    success: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold"
  };

  const sizes = {
    sm: "px-3.5 py-2 rounded-xl text-xs",
    md: "px-5 py-3 rounded-2xl text-sm",
    lg: "px-6 py-4 rounded-2xl text-base"
  };

  return (
    <button 
      className={cn(
        "flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none font-sans",
        variants[variant],
        sizes[size],
        className
      )} 
      {...props} 
    />
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest ml-1">{label}</label>}
      <input 
        className={cn(
          "w-full px-4 py-3 rounded-2xl bg-white border-2 border-[#f1f3f7] focus:outline-none focus:border-[#2563eb] focus:ring-0 transition-all text-stone-800 placeholder:text-stone-300 text-sm font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]",
          error && "border-red-300 focus:border-red-500",
          className
        )} 
        {...props} 
      />
      {error && <span className="text-xs text-red-600 ml-1 font-medium">{error}</span>}
    </div>
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string }[];
  error?: string;
}

export function Select({ className, label, options, error, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest ml-1">{label}</label>}
      <div className="relative">
        <select 
          className={cn(
            "w-full px-4 py-3 rounded-2xl bg-white border-2 border-[#f1f3f7] focus:outline-none focus:border-[#2563eb] focus:ring-0 transition-all text-stone-800 text-sm font-medium appearance-none pr-10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]",
            error && "border-red-300 focus:border-red-500",
            className
          )} 
          {...props} 
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-stone-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <span className="text-xs text-red-600 ml-1 font-medium">{error}</span>}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ className, label, error, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest ml-1">{label}</label>}
      <textarea 
        className={cn(
          "w-full px-4 py-3 rounded-2xl bg-white border-2 border-[#f1f3f7] focus:outline-none focus:border-[#2563eb] focus:ring-0 transition-all text-stone-800 placeholder:text-stone-300 text-sm font-medium resize-y min-h-[100px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]",
          error && "border-red-300 focus:border-red-500",
          className
        )} 
        {...props} 
      />
      {error && <span className="text-xs text-red-600 ml-1 font-medium">{error}</span>}
    </div>
  );
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'stone' | 'purple' | 'indigo';
}

export function Badge({ className, variant = 'stone', ...props }: BadgeProps) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    stone: "bg-stone-50 text-stone-600 border-stone-200",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100"
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

export interface SectionTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  subtitle?: string;
}

export function SectionTitle({ className, children, subtitle, ...props }: SectionTitleProps) {
  return (
    <div className="space-y-1 py-1">
      <h2 className={cn("text-xs font-black tracking-widest uppercase text-stone-400 font-sans", className)} {...props}>
        {children}
      </h2>
      {subtitle && <p className="text-xs text-stone-400 font-medium font-sans">{subtitle}</p>}
    </div>
  );
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-[#f1f3f7] rounded-3xl space-y-3 shadow-[0_8px_30px_rgb(28,52,106,0.01)]">
      {icon && (
        <div className="p-4 bg-stone-50 rounded-full text-stone-400">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-[#1e293b]">{title}</h4>
        {description && <p className="text-xs text-stone-400 leading-relaxed max-w-sm">{description}</p>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export interface IconBubbleProps {
  icon: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'stone' | 'purple' | 'indigo';
  size?: 'sm' | 'md' | 'lg';
}

export function IconBubble({ icon, variant = 'blue', size = 'md' }: IconBubbleProps) {
  const bgStyles = {
    blue: "bg-[#eff6ff] text-[#2563eb]",
    emerald: "bg-[#ecfdf5] text-[#10b981]",
    amber: "bg-[#fffbeb] text-[#f59e0b]",
    rose: "bg-[#fff1f2] text-[#f43f5e]",
    stone: "bg-[#f8fafc] text-[#64748b]",
    purple: "bg-[#faf5ff] text-[#a855f7]",
    indigo: "bg-[#eef2ff] text-[#6366f1]"
  };

  const sizeStyles = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-11 h-11 rounded-2xl",
    lg: "w-14 h-14 rounded-3xl"
  };

  return (
    <div className={cn("flex items-center justify-center flex-shrink-0 font-sans shadow-xs border border-white/40", bgStyles[variant], sizeStyles[size])}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: cn(size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-7 h-7') })}
    </div>
  );
}

export function StatusPill({ status }: { status: 'Realizada' | 'Falta' | 'Cancelada' | 'Remarcada' | string }) {
  const config: Record<string, { label: string; text: string; bg: string; border: string }> = {
    'Realizada': { label: 'Realizada', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    'Falta': { label: 'Falta', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100' },
    'Cancelada': { label: 'Cancelada', text: 'text-stone-600', bg: 'bg-stone-100', border: 'border-stone-200' },
    'Remarcada': { label: 'Remarcada', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' }
  };

  const item = config[status] || { label: status, text: 'text-[#1e40af]', bg: 'bg-[#eff6ff]', border: 'border-[#bfdbfe]' };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border", item.text, item.bg, item.border)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {item.label}
    </span>
  );
}
