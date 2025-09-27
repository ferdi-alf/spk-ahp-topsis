import { Link } from "@inertiajs/react";

export default function SidebarItems({
    active = false,
    color = "blue",
    title = "",
    icon,
    ...props
}) {
    const colorClasses = {
        blue: {
            bg: "bg-blue-100",
            text: "text-blue-500",
        },
        green: {
            bg: "bg-green-100",
            text: "text-green-500",
        },
        red: {
            bg: "bg-red-100",
            text: "text-red-500",
        },
        purple: {
            bg: "bg-purple-100",
            text: "text-purple-500",
        },
        orange: {
            bg: "bg-orange-100",
            text: "text-orange-500",
        },
        indigo: {
            bg: "bg-indigo-100",
            text: "text-indigo-500",
        },
        fuchsia: {
            bg: "bg-fuchsia-100",
            text: "text-fuchsia-500",
        },
        yellow: {
            bg: "bg-yellow-100",
            text: "text-yellow-500",
        },
        pink: {
            bg: "bg-pink-100",
            text: "text-pink-500",
        },
        teal: {
            bg: "bg-teal-100",
            text: "text-teal-500",
        },
        cyan: {
            bg: "bg-cyan-100",
            text: "text-cyan-500",
        },
        emerald: {
            bg: "bg-emerald-100",
            text: "text-emerald-500",
        },
    };

    const activeColors = colorClasses[color];

    return (
        <li>
            <Link
                className={`p-2 flex items-center gap-4 rounded-lg transition-colors ${
                    active
                        ? `${activeColors.bg} ${activeColors.text}`
                        : "text-gray-700 hover:bg-slate-50"
                }`}
                {...props}
            >
                <span className={`text-2xl ${activeColors.text}`}>{icon}</span>
                <span className="font-bold text-lg">{title}</span>
            </Link>
        </li>
    );
}
