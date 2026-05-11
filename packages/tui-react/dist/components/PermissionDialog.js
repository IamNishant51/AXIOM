/**
 * PermissionDialog - Authorization prompts for tool execution
 * Like Claude Code's permission dialogs
 */
import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "../theme/index.js";
export const PermissionDialog = ({ type, title, message, details, onAllow, onDeny, onAllowOnce, preview, }) => {
    const theme = useTheme();
    const [selected, setSelected] = useState("allow");
    const hasAllowOnce = typeof onAllowOnce === "function";
    // Icon based on type
    const getIcon = () => {
        switch (type) {
            case "tool": return "⚙";
            case "write": return "📝";
            case "dangerous": return "⚠";
            case "network": return "🌐";
            default: return "▶";
        }
    };
    // Color based on type
    const getColor = () => {
        switch (type) {
            case "dangerous": return "#F87171";
            case "network": return "#60A5FA";
            case "write": return "#FBBF24";
            default: return theme.colors.primary;
        }
    };
    const accentColor = getColor();
    // Keyboard navigation
    useInput((input, key) => {
        if (key.upArrow || input === "k") {
            setSelected((prev) => {
                if (prev === "allowOnce")
                    return "allow";
                if (prev === "allow")
                    return "deny";
                return "deny";
            });
        }
        else if (key.downArrow || input === "j") {
            setSelected((prev) => {
                if (prev === "deny")
                    return hasAllowOnce ? "allowOnce" : "allow";
                if (prev === "allow")
                    return hasAllowOnce ? "allowOnce" : "deny";
                return "allow";
            });
        }
        else if (key.return) {
            if (selected === "allow")
                onAllow();
            else if (selected === "allowOnce" && hasAllowOnce)
                onAllowOnce();
            else
                onDeny();
        }
        else if (key.escape) {
            onDeny();
        }
    });
    // Options to display
    const options = [
        { key: "allow", label: "Allow", description: "Always allow this action" },
        ...(hasAllowOnce ? [{ key: "allowOnce", label: "Allow Once", description: "Allow this time only" }] : []),
        { key: "deny", label: "Deny", description: "Block this action" },
    ];
    return (React.createElement(Box, { flexDirection: "column", borderStyle: "round", borderColor: accentColor, paddingX: 2, paddingY: 1 },
        React.createElement(Box, { flexDirection: "row", alignItems: "center", marginBottom: 1 },
            React.createElement(Text, { bold: true, color: accentColor }, getIcon()),
            React.createElement(Text, { color: theme.colors.textMuted }, " "),
            React.createElement(Text, { bold: true, color: theme.colors.text }, title)),
        React.createElement(Text, { color: theme.colors.text }, message),
        details && (React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, details))),
        preview && (React.createElement(Box, { flexDirection: "column", marginTop: 1, paddingLeft: 1, borderStyle: "single", borderColor: theme.colors.borderDim },
            React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, "Preview:"),
            React.createElement(Text, { color: theme.colors.textDim }, preview.slice(0, 200)),
            preview.length > 200 && (React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, "... (truncated)")))),
        React.createElement(Box, { flexDirection: "column", marginTop: 2 }, options.map((opt) => (React.createElement(Box, { key: opt.key, flexDirection: "row", alignItems: "center" },
            React.createElement(Text, { color: selected === opt.key ? theme.colors.text : theme.colors.textMuted, inverse: selected === opt.key, bold: selected === opt.key }, selected === opt.key ? "▸" : " "),
            React.createElement(Text, { color: theme.colors.textMuted }, " "),
            React.createElement(Text, { bold: selected === opt.key, color: selected === opt.key ? theme.colors.text : theme.colors.textMuted }, opt.label),
            React.createElement(Text, { color: theme.colors.textMuted }, " - "),
            React.createElement(Text, { color: theme.colors.textMuted }, opt.description))))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true, color: theme.colors.textMuted }, "[\u2191\u2193 select, Enter confirm, Esc cancel]"))));
};
// Permission request queue manager
export class PermissionManager {
    queue = [];
    current = null;
    onRequest = null;
    constructor(onRequest) {
        this.onRequest = onRequest;
    }
    add(permission) {
        this.queue.push(permission);
        this.process();
    }
    process() {
        if (this.current || this.queue.length === 0)
            return;
        this.current = this.queue.shift();
        this.onRequest?.(this.current);
    }
    resolve(allowed, allowOnce = false) {
        const permission = this.current;
        if (!permission)
            return;
        if (allowed || allowOnce) {
            permission.onAllow();
        }
        else {
            permission.onDeny();
        }
        this.current = null;
        this.process();
    }
}
export default PermissionDialog;
