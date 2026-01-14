import { useState, useRef, useEffect } from "react";
import CopyIcon from "./icons/CopyIcon";
import CheckIcon from "./icons/CheckIcon";

interface ShareDropdownProps {
    shareUrl: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ShareDropdown({ shareUrl, isOpen, onClose }: ShareDropdownProps) {
    const [copied, setCopied] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-xl border border-black/10 dark:border-white/10 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
            <div className="text-xs text-gray-500 dark:text-white/50 mb-2">
                Share link
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 text-sm bg-black/5 dark:bg-white/5 rounded-lg text-gray-900 dark:text-white border border-black/5 dark:border-white/5 focus:outline-none"
                />
                <button
                    onClick={handleCopy}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-700 dark:text-white transition-colors"
                    title={copied ? "Copied!" : "Copy link"}
                >
                    {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                </button>
            </div>
            <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                <p className="text-xs text-gray-400 dark:text-white/40">
                    Anyone with this link can view this chat
                </p>
            </div>
        </div>
    );
}
