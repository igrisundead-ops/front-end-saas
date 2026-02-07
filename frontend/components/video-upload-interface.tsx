"use client";

import { useEffect, useRef, useCallback, useTransition } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    Video,
    Upload,
    FileUp,
    Figma,
    MonitorIcon,
    CircleUserRound,
    ArrowUpIcon,
    Paperclip,
    PlusIcon,
    SendIcon,
    XIcon,
    LoaderIcon,
    Sparkles,
    Command,
    Grid3X3,
    ImageIcon, // Added import for ImageIcon
    Link as LinkIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SendPopup } from "@/components/ui/send-popup";
import { FileUpload } from "@/components/ui/file-upload";
import { STYLE_TEMPLATES } from "@/lib/styles/style-templates";
import { createProcessingJob, createProject, getActiveStyleId, getJobStatus, startProcessing as persistStartProcessing, setActiveStyleId as persistActiveStyleId } from "@/lib/mock";
import type { ProcessingJob } from "@/lib/types";

type AirtableImageArchiveResponse = {
    items: Array<{
        id: string;
        name: string | null;
        styleKey: string | null;
        imageUrl: string | null;
        thumbUrl: string | null;
        hasAttachment: boolean;
        tags: string[];
        updatedTime: string;
    }>;
};

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
    icon: React.ReactNode;
    label: string;
    description: string;
    prefix: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

type SlashCommandKey = "clone" | "improve";
const SLASH_COMMANDS = {
    clone: { label: "Clone Editing Style", raw: "/clone" },
    improve: { label: "Improve", raw: "/improve" },
} as const;
type ActiveSlashCommand = {
    key: SlashCommandKey;
    label: (typeof SLASH_COMMANDS)[SlashCommandKey]["label"];
    raw: (typeof SLASH_COMMANDS)[SlashCommandKey]["raw"];
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    
    return (
      <div className={cn(
        "relative",
        containerClassName
      )}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showRing && isFocused && (
          <motion.span 
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-violet-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {props.onChange && (
          <div 
            className="absolute bottom-2 right-2 opacity-0 w-2 h-2 bg-violet-500 rounded-full"
            style={{
              animation: 'none',
            }}
            id="textarea-ripple"
          />
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export function VideoUploadInterface() {
    const router = useRouter();
    const [value, setValue] = useState("");
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [showFileUploadModal, setShowFileUploadModal] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string>("");
    const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
    const [recentCommand, setRecentCommand] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });
    const [inputFocused, setInputFocused] = useState(false);
    const commandPaletteRef = useRef<HTMLDivElement>(null);
    const [activeSuggestion, setActiveSuggestion] = useState(-1);
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [, startTransition] = useTransition();

    const [templatesOpen, setTemplatesOpen] = useState(false);
    const [airtableStylePreviews, setAirtableStylePreviews] = useState<Record<string, string[]>>({});
    const [failedImages, setFailedImages] = useState<Record<string, true>>({});
    const [activeStyleId, setActiveStyleId] = useState<string | null>(null);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [job, setJob] = useState<ProcessingJob | null>(null);
    const [sendOpen, setSendOpen] = useState(false);

    const [sourceProvider, setSourceProvider] = useState("YouTube");
    const [sourceUrl, setSourceUrl] = useState("");
    const [activeSlashCommand, setActiveSlashCommand] = useState<ActiveSlashCommand | null>(null);
    const [showVideoPreview, setShowVideoPreview] = useState(false);
    const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
    const [previewVideoTitle, setPreviewVideoTitle] = useState<string>("");

    const activeStyle = React.useMemo(
        () => STYLE_TEMPLATES.find((s) => s.id === activeStyleId) ?? null,
        [activeStyleId]
    );

    const commandSuggestions: CommandSuggestion[] = [
        { 
            icon: <ImageIcon className="w-4 h-4" />, 
            label: "Clone Editing Style", 
            description: "Generate a UI from a screenshot", 
            prefix: "/clone" 
        },
        { 
            icon: <MonitorIcon className="w-4 h-4" />, 
            label: "Improve", 
            description: "Improve existing UI design", 
            prefix: "/improve" 
        },
    ];

    useEffect(() => {
        if (activeSlashCommand) {
            setShowCommandPalette(false);
            return;
        }

        if (value.startsWith('/') && !value.includes(' ')) {
            setShowCommandPalette(true);
            
            const matchingSuggestionIndex = commandSuggestions.findIndex(
                (cmd) => cmd.prefix.startsWith(value)
            );
            
            if (matchingSuggestionIndex >= 0) {
                setActiveSuggestion(matchingSuggestionIndex);
            } else {
                setActiveSuggestion(-1);
            }
        } else {
            setShowCommandPalette(false);
        }
    }, [activeSlashCommand, value]);

    useEffect(() => {
        if (activeSlashCommand) return;
        const match = value.match(/^\/(clone|improve)\s+/);
        if (!match) return;
        const key = match[1] as SlashCommandKey;
        setActiveSlashCommand({
            key,
            label: SLASH_COMMANDS[key].label,
            raw: SLASH_COMMANDS[key].raw,
        });
        setValue(value.replace(/^\/(clone|improve)\s+/, ""));
        adjustHeight(true);
    }, [activeSlashCommand, adjustHeight, value]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const id = getActiveStyleId();
        setActiveStyleId(id && id.length > 0 ? id : null);
    }, []);

    useEffect(() => {
        if (process.env.NODE_ENV !== "development") return;
        if (typeof window === "undefined") return;

        const w = window as unknown as { __airtableVerifyChecklistLogged?: boolean };
        if (w.__airtableVerifyChecklistLogged) return;
        w.__airtableVerifyChecklistLogged = true;

        console.log(
            [
                "[Airtable] Run and verify:",
                "1) Verify health: open /api/airtable/health",
                "2) Verify items: open /api/airtable/images?limit=5",
                "3) UI: open Templates and Styles modal, look for Airtable/Local badge",
            ].join("\n")
        );
    }, []);

    useEffect(() => {
        let cancelled = false;

        const norm = (s: string) =>
            s
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");

        async function loadAirtableStylePreviews() {
            try {
                const res = await fetch("/api/airtable/images?limit=20", { cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = (await res.json()) as AirtableImageArchiveResponse;
                const byStyle: Record<string, string[]> = {};

                for (const item of data.items ?? []) {
                    const styleKey = norm((item.styleKey ?? "").trim());
                    const src = item.thumbUrl ?? item.imageUrl ?? null;
                    if (!styleKey || !src) continue;
                    (byStyle[styleKey] ??= []).push(src);
                }

                for (const key of Object.keys(byStyle)) {
                    byStyle[key] = Array.from(new Set(byStyle[key])).slice(0, 3);
                }

                if (process.env.NODE_ENV === "development") {
                    console.log("[Airtable] styleKeys:", Object.keys(byStyle).slice(0, 20));
                }
                if (!cancelled) setAirtableStylePreviews(byStyle);
            } catch (err) {
                console.error("Failed to load Airtable Image Archive previews", err);
                if (!cancelled) setAirtableStylePreviews({});
            }
        }

        loadAirtableStylePreviews();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!projectId) return;
        const tick = () => setJob(getJobStatus(projectId));
        tick();
        const t = window.setInterval(tick, 200);
        return () => window.clearInterval(t);
    }, [projectId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector('[data-command-button]');
            
            if (commandPaletteRef.current && 
                !commandPaletteRef.current.contains(target) && 
                !commandButton?.contains(target)) {
                setShowCommandPalette(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (activeSlashCommand && e.key === "Backspace") {
            const el = textareaRef.current;
            if (el && el.selectionStart === 0 && el.selectionEnd === 0) {
                e.preventDefault();
                setActiveSlashCommand(null);
                return;
            }
        }

        if (showCommandPalette) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev < commandSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev > 0 ? prev - 1 : commandSuggestions.length - 1
                );
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selectedCommand = commandSuggestions[activeSuggestion];
                    setValue(selectedCommand.prefix + ' ');
                    setShowCommandPalette(false);
                    
                    setRecentCommand(selectedCommand.label);
                    setTimeout(() => setRecentCommand(null), 3500);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const trimmed = value.trim();
            if (!activeSlashCommand && (trimmed === "/clone" || trimmed === "/improve")) {
                const key = trimmed.slice(1) as SlashCommandKey;
                setActiveSlashCommand({ key, label: SLASH_COMMANDS[key].label, raw: SLASH_COMMANDS[key].raw });
                setValue("");
                adjustHeight(true);
                return;
            }

            if (trimmed || activeSlashCommand) {
                handleSendMessage();
            }
        }
    };

    const handleSendMessage = () => {
        const message = value.trim();
        const prompt = activeSlashCommand
            ? `${activeSlashCommand.raw}${message ? ` ${message}` : ""}`
            : message;
        if (!prompt) return;
        if (job?.status === "running") {
            setSendOpen(true);
            return;
        }

        startTransition(() => {
            setIsTyping(true);

            const titleBase =
                uploadedFileName?.trim().length > 0
                    ? uploadedFileName.replace(/\.[^/.]+$/, "")
                    : (message || activeSlashCommand?.label || prompt).slice(0, 28);

            const project = createProject({ title: titleBase || "PROMETHEUS Project" });
            setProjectId(project.id);

            const nextJob = createProcessingJob({
                projectId: project.id,
                input: {
                    prompt,
                    sources: attachments,
                    styleId: activeStyleId ?? undefined,
                },
            });
            persistStartProcessing(nextJob);
            setJob(nextJob);
            setSendOpen(true);
            setActiveSlashCommand(null);

            window.setTimeout(() => setIsTyping(false), 650);
        });
    };

    const handleAttachFile = () => {
        const mockFileName = `file-${Math.floor(Math.random() * 1000)}.mp4`;
        setAttachments(prev => (prev.includes(mockFileName) ? prev : [mockFileName, ...prev]));
    };

    const addSourceChip = (label: string) => {
        const trimmed = label.trim();
        if (!trimmed) return;
        setAttachments((prev) => (prev.includes(trimmed) ? prev : [trimmed, ...prev]));
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };
    
    const selectCommandSuggestion = (index: number) => {
        const selectedCommand = commandSuggestions[index];
        setValue(selectedCommand.prefix + ' ');
        setShowCommandPalette(false);
        
        setRecentCommand(selectedCommand.label);
        setTimeout(() => setRecentCommand(null), 2000);
    };

    return (
        <div className="min-h-screen flex flex-col w-full items-center justify-center bg-transparent text-white p-6 relative overflow-hidden">
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
                <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
            </div>
            <div className="w-full max-w-2xl mx-auto relative">
                <motion.div 
                    className="relative z-10 space-y-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="text-center space-y-3">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="inline-block"
                        >
                            <h1 className="text-3xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 pb-1">
                                Upload Your Video
                            </h1>
                            <motion.div 
                                className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: "100%", opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                            />
                        </motion.div>
                        <motion.p 
                            className="text-sm text-white/40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            Drag and drop your video or click to select
                        </motion.p>
                    </div>

                    <motion.div 
                        className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl"
                        initial={{ scale: 0.98 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <AnimatePresence>
                            {showCommandPalette && (
                                <motion.div 
                                    ref={commandPaletteRef}
                                    className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-white/10 overflow-hidden"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="py-1 bg-black/95">
                                        {commandSuggestions.map((suggestion, index) => (
                                            <motion.div
                                                key={suggestion.prefix}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                                                    activeSuggestion === index 
                                                        ? "bg-white/10 text-white" 
                                                        : "text-white/70 hover:bg-white/5"
                                                )}
                                                onClick={() => selectCommandSuggestion(index)}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.03 }}
                                            >
                                                <div className="w-5 h-5 flex items-center justify-center text-white/60">
                                                    {suggestion.icon}
                                                </div>
                                                <div className="font-medium">{suggestion.label}</div>
                                                <div className="text-white/40 text-xs ml-1">
                                                    {suggestion.prefix}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-4 space-y-3">
                            <AnimatePresence>
                                {activeSlashCommand && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                        transition={{ duration: 0.18, ease: "easeOut" }}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-purple-400/20 bg-purple-500/10 px-3 py-2"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Sparkles className="w-4 h-4 text-purple-200/90" />
                                            <div className="min-w-0">
                                                <div className="text-xs font-medium text-white/90 truncate">
                                                    {activeSlashCommand.label}
                                                </div>
                                                <div className="text-[11px] text-white/45 truncate">
                                                    {activeSlashCommand.raw}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveSlashCommand(null)}
                                            className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
                                            aria-label="Remove command"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <Textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    adjustHeight();
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setInputFocused(false)}
                                placeholder="Describe your video or add notes..."
                                containerClassName="w-full"
                                className={cn(
                                    "w-full px-4 py-3",
                                    "resize-none",
                                    "bg-transparent",
                                    "border-none",
                                    "text-white/90 text-sm",
                                    "focus:outline-none",
                                    "placeholder:text-white/20",
                                    "min-h-[60px]"
                                )}
                                style={{
                                    overflow: "hidden",
                                }}
                                showRing={false}
                            />
                        </div>

                        <AnimatePresence>
                            {(attachments.length > 0 || !!activeStyle) && (
                                <motion.div 
                                    className="px-4 pb-3 flex gap-2 flex-wrap"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    {activeStyle && (
                                        <motion.div
                                            className="flex items-center gap-2 text-xs bg-purple-500/10 border border-purple-400/20 py-1.5 px-3 rounded-lg text-white/80"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                        >
                                            <span>Style: {activeStyle.name}</span>
                                            <button
                                                onClick={() => {
                                                    setActiveStyleId(null);
                                                    persistActiveStyleId(null);
                                                }}
                                                className="text-white/40 hover:text-white transition-colors"
                                                aria-label="Clear style"
                                            >
                                                <XIcon className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    )}
                                    {attachments.map((file, index) => (
                                        <motion.div
                                            key={index}
                                            className="flex items-center gap-2 text-xs bg-white/[0.03] py-1.5 px-3 rounded-lg text-white/70"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                        >
                                            <span>{file}</span>
                                            <button 
                                                onClick={() => removeAttachment(index)}
                                                className="text-white/40 hover:text-white transition-colors"
                                            >
                                                <XIcon className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-4 border-t border-white/[0.05] flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <motion.button
                                    type="button"
                                    onClick={() => setShowFileUploadModal(true)}
                                    whileTap={{ scale: 0.94 }}
                                    className="p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group"
                                    title="Add source"
                                >
                                    <LinkIcon className="w-4 h-4" />
                                    <motion.span
                                        className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        layoutId="button-highlight"
                                    />
                                </motion.button>
                                <motion.button
                                    type="button"
                                    onClick={() => setTemplatesOpen(true)}
                                    whileTap={{ scale: 0.94 }}
                                    className={cn(
                                        "p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group",
                                        templatesOpen && "bg-white/10 text-white/90"
                                    )}
                                    title="Templates and styles"
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                    <motion.span
                                        className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        layoutId="button-highlight"
                                    />
                                </motion.button>
                                <motion.button
                                    type="button"
                                    data-command-button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowCommandPalette(prev => !prev);
                                    }}
                                    whileTap={{ scale: 0.94 }}
                                    className={cn(
                                        "p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group",
                                        showCommandPalette && "bg-white/10 text-white/90"
                                    )}
                                >
                                    <Command className="w-4 h-4" />
                                    <motion.span
                                        className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        layoutId="button-highlight"
                                    />
                                </motion.button>
                            </div>
                            
                            <motion.button
                                type="button"
                                onClick={handleSendMessage}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={isTyping || (!value.trim() && !activeSlashCommand)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    "flex items-center gap-2",
                                    (value.trim() || activeSlashCommand)
                                        ? "bg-white text-[#0A0A0B] shadow-lg shadow-white/10"
                                        : "bg-white/[0.05] text-white/40"
                                )}
                            >
                                {isTyping ? (
                                    <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                                ) : (
                                    <SendIcon className="w-4 h-4" />
                                )}
                                <span>Send</span>
                            </motion.button>
                        </div>
                    </motion.div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {commandSuggestions.map((suggestion, index) => (
                            <motion.button
                                key={suggestion.prefix}
                                onClick={() => selectCommandSuggestion(index)}
                                className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg text-sm text-white/60 hover:text-white/90 transition-all relative group"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {suggestion.icon}
                                <span>{suggestion.label}</span>
                                <motion.div
                                    className="absolute inset-0 border border-white/[0.05] rounded-lg"
                                    initial={false}
                                    animate={{
                                        opacity: [0, 1],
                                        scale: [0.98, 1],
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        ease: "easeOut",
                                    }}
                                />
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>

            <SendPopup
                open={sendOpen}
                onOpenChange={setSendOpen}
                onOpenEditor={() => {
                    router.push(projectId ? `/editor/${projectId}` : "/editor");
                }}
            />

            {/* ADD SOURCE MODAL */}
            <Dialog open={showFileUploadModal} onOpenChange={setShowFileUploadModal}>
                <DialogContent className="max-w-3xl p-0">
                    <DialogHeader className="px-6 pt-6">
                        <DialogTitle>Add Source</DialogTitle>
                        <DialogDescription>
                            Import links, uploads, integrations, brand kit, and references (mock).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 pb-6">
                        <Tabs defaultValue="link">
                            <TabsList className="w-full">
                                <TabsTrigger value="link" className="flex-1">Link</TabsTrigger>
                                <TabsTrigger value="upload" className="flex-1">Upload</TabsTrigger>
                                <TabsTrigger value="integrations" className="flex-1">Integrations</TabsTrigger>
                                <TabsTrigger value="brand" className="flex-1">Brand Kit</TabsTrigger>
                                <TabsTrigger value="refs" className="flex-1">References</TabsTrigger>
                            </TabsList>

                            <TabsContent value="link" className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {["YouTube", "Drive", "Dropbox", "Loom", "X", "TikTok"].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setSourceProvider(p)}
                                            className={cn(
                                                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                                                sourceProvider === p
                                                    ? "border-purple-400/30 bg-purple-500/10 text-white"
                                                    : "border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.05] hover:text-white/80"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Input
                                        value={sourceUrl}
                                        onChange={(e) => setSourceUrl(e.target.value)}
                                        placeholder="Paste a link…"
                                    />
                                    <Button
                                        onClick={() => {
                                            if (!sourceUrl.trim()) return;
                                            addSourceChip(`${sourceProvider} imported`);
                                            setSourceUrl("");
                                            setShowFileUploadModal(false);
                                        }}
                                        className="bg-white text-[#0A0A0B] hover:bg-white/90"
                                    >
                                        Import
                                    </Button>
                                </div>
                                <div className="text-xs text-white/45">
                                    Supported: YouTube, Drive, Dropbox, Loom, X, TikTok (mock).
                                </div>
                            </TabsContent>

                            <TabsContent value="upload" className="space-y-3">
                                <div className="text-xs text-white/45">
                                    Upload video/audio/srt/fonts/images (mock). Video preview uses a local object URL.
                                </div>
                                <FileUpload
                                    onChange={(files) => {
                                        if (files.length === 0) return;
                                        const f = files[0]!;
                                        setUploadedFileName(f.name);
                                        try {
                                            const url = URL.createObjectURL(f);
                                            setUploadedVideoUrl(url);
                                        } catch {
                                            // ignore
                                        }
                                        addSourceChip(`Upload: ${f.name}`);
                                        setShowFileUploadModal(false);
                                    }}
                                />
                            </TabsContent>

                            <TabsContent value="integrations" className="grid gap-3 sm:grid-cols-2">
                                {[
                                    { name: "Google Drive", note: "Import from your drive (mock)" },
                                    { name: "Dropbox", note: "Import folders and files (mock)" },
                                    { name: "Loom", note: "Pull recordings (mock)" },
                                    { name: "TikTok", note: "Import source clips (mock)" },
                                ].map((c) => (
                                    <div
                                        key={c.name}
                                        className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                                    >
                                        <div className="text-sm font-medium text-white/85">{c.name}</div>
                                        <div className="mt-1 text-xs text-white/45">{c.note}</div>
                                        <div className="mt-3">
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => addSourceChip(`${c.name} connected`)}
                                            >
                                                Connect (Mock)
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </TabsContent>

                            <TabsContent value="brand" className="space-y-3">
                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                    <div className="text-sm font-medium text-white/85">Brand Kit</div>
                                    <div className="mt-1 text-xs text-white/45">
                                        Fonts, colors, watermark and safe margins (mock).
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <Button
                                            className="bg-white text-[#0A0A0B] hover:bg-white/90"
                                            onClick={() => addSourceChip("Brand kit loaded")}
                                        >
                                            Load Brand Kit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => addSourceChip("Watermark enabled")}
                                        >
                                            Enable watermark
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="refs" className="space-y-3">
                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                    <div className="text-sm font-medium text-white/85">Reference</div>
                                    <div className="mt-1 text-xs text-white/45">
                                        Use your local inspiration video for interaction patterns only (no asset copying).
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => addSourceChip("Reference notes added")}
                                        >
                                            Add reference note
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>

            {/* TEMPLATES + STYLES */}
            <Sheet open={templatesOpen} onOpenChange={setTemplatesOpen}>
                <SheetContent side="right" className="p-0 flex flex-col overflow-hidden">
                    <SheetHeader className="px-6 pt-6">
                        <SheetTitle>Templates and Styles</SheetTitle>
                        <SheetDescription>
                            Select one active style. Saved in localStorage.
                        </SheetDescription>
                        {process.env.NODE_ENV === "development" && (
                            <div className="mt-1 text-[11px] leading-tight text-white/45">
                                Airtable previews loaded: {Object.keys(airtableStylePreviews).length} styles
                                {Object.keys(airtableStylePreviews).length === 0 && (
                                    <span className="ml-2 text-white/35">
                                        No Airtable previews matched. Check styleKey mapping.
                                    </span>
                                )}
                            </div>
                        )}
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-4 space-y-4">
                        <div className="grid gap-3">
                            {STYLE_TEMPLATES.map((template) => {
                                const selected = template.id === activeStyleId;

                                const norm = (s: string) =>
                                    s
                                        .toLowerCase()
                                        .trim()
                                        .replace(/[^a-z0-9]+/g, "-")
                                        .replace(/(^-|-$)/g, "");

                                const candidates = [
                                    template.id,
                                    template.name,
                                    template.id.replace(/^style_/, ""),
                                ].map(norm);

                                const matchedKey = candidates.find((k) => !!airtableStylePreviews[k]);

                                const previewImages = matchedKey
                                    ? airtableStylePreviews[matchedKey]
                                    : template.previewImages;
                                const hasPreviews = previewImages.length > 0;
                                const source =
                                    matchedKey && airtableStylePreviews[matchedKey]?.length > 0
                                        ? "airtable"
                                        : "fallback";
                                return (
                                    <button
                                        key={template.id}
                                        onClick={() => {
                                            setActiveStyleId(template.id);
                                            persistActiveStyleId(template.id);
                                            setTemplatesOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left rounded-xl border p-4 transition-colors transition-shadow",
                                            selected
                                                ? "border-purple-400/30 bg-purple-500/10 shadow-[0_0_0_1px_rgba(168,85,247,0.16)]"
                                                : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-400/30 hover:shadow-[0_0_0_1px_rgba(168,85,247,0.12)]"
                                        )}
                                    >
                                        <div className="flex gap-3">
                                            <div className="hidden sm:grid grid-cols-3 gap-2">
                                                {hasPreviews ? (
                                                    previewImages.slice(0, 3).map((src) => (
                                                        <div
                                                            key={src}
                                                            className="relative h-16 w-24 overflow-hidden rounded-lg border border-white/10"
                                                        >
                                                            {failedImages[src] ? (
                                                                <div className="flex h-full w-full items-center justify-center bg-white/[0.03] text-white/40">
                                                                    <ImageIcon className="h-4 w-4" />
                                                                </div>
                                                            ) : (
                                                                <Image
                                                                    src={src}
                                                                    alt=""
                                                                    fill
                                                                    className="object-cover"
                                                                    sizes="96px"
                                                                    loading="lazy"
                                                                    onError={() =>
                                                                        setFailedImages((m) => ({ ...m, [src]: true }))
                                                                    }
                                                                />
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] text-white/40">
                                                        <ImageIcon className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="sm:hidden relative h-24 w-full overflow-hidden rounded-lg border border-white/10">
                                                {hasPreviews ? (
                                                    failedImages[previewImages[0]] ? (
                                                        <div className="flex h-full w-full items-center justify-center bg-white/[0.03] text-white/40">
                                                            <ImageIcon className="h-5 w-5" />
                                                        </div>
                                                    ) : (
                                                        <Image
                                                            src={previewImages[0]}
                                                            alt=""
                                                            fill
                                                            className="object-cover"
                                                            sizes="100vw"
                                                            loading="lazy"
                                                            onError={() =>
                                                                setFailedImages((m) => ({
                                                                    ...m,
                                                                    [previewImages[0]]: true,
                                                                }))
                                                            }
                                                        />
                                                    )
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-white/[0.03] text-white/40">
                                                        <ImageIcon className="h-5 w-5" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="text-sm font-semibold text-white/90">{template.name}</div>
                                                    <div className="flex items-center gap-2">
                                                        {process.env.NODE_ENV === "development" && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-[10px] px-2 py-0.5"
                                                            >
                                                                {source === "airtable" ? "Airtable" : "Local"}
                                                            </Badge>
                                                        )}
                                                        {selected ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Style</Badge>}
                                                    </div>
                                                </div>
                                                <div className="mt-1 text-xs text-white/45">{template.description}</div>
                                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                                    {template.tags.map((tag) => (
                                                        <Badge key={tag} variant="secondary">{tag}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

function TypingDots() {
    return (
        <div className="flex items-center ml-1">
            {[1, 2, 3].map((dot) => (
                <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 bg-white/90 rounded-full mx-0.5"
                    initial={{ opacity: 0.3 }}
                    animate={{ 
                        opacity: [0.3, 0.9, 0.3],
                        scale: [0.85, 1.1, 0.85]
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: dot * 0.15,
                        ease: "easeInOut",
                    }}
                    style={{
                        boxShadow: "0 0 4px rgba(255, 255, 255, 0.3)"
                    }}
                />
            ))}
        </div>
    );
}

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
}

function ActionButton({ icon, label }: ActionButtonProps) {
    const [isHovered, setIsHovered] = React.useState(false);
    
    return (
        <motion.button
            type="button"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 rounded-full border border-neutral-800 text-neutral-400 hover:text-white transition-all relative overflow-hidden group"
        >
            <div className="relative z-10 flex items-center gap-2">
                {icon}
                <span className="text-xs relative z-10">{label}</span>
            </div>
            
            <AnimatePresence>
                {isHovered && (
                    <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-indigo-500/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                )}
            </AnimatePresence>
            
            <motion.span 
                className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500"
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.3 }}
            />
        </motion.button>
    );
}

const rippleKeyframes = `
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}
`;

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = rippleKeyframes;
    document.head.appendChild(style);
}
