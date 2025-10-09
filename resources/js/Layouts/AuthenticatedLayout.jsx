import SidebarItems from "@/Components/SidebarItems";
import { Link, usePage, router } from "@inertiajs/react";
import { useRef, useState, useEffect } from "react";
import { ToastContainer } from "react-fox-toast";
import {
    Dashboard,
    Person,
    Menu,
    Logout,
    Hub,
    Build,
    PieChart,
    FilterList,
    PeopleTwoTone,
} from "@mui/icons-material";

export default function AuthenticatedLayout({ children }) {
    const user = usePage().props.auth.user;
    const dropdownRef = useRef(null);
    const sidebarRef = useRef(null);
    console.log(user);

    useEffect(() => {
        const hasReloaded = sessionStorage.getItem("hasReloadedOnce");
        if (!hasReloaded) {
            sessionStorage.setItem("hasReloadedOnce", "true");
            window.location.reload();
        }
    }, []);

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);
    const [sidebar, setSidebar] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowingNavigationDropdown(false);
            }
        };

        if (showingNavigationDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showingNavigationDropdown]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target)
            ) {
                if (window.innerWidth < 640) {
                    setSidebar(false);
                }
            }
        };

        if (sidebar) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [sidebar]);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setShowingNavigationDropdown(false);
                if (window.innerWidth < 640) {
                    setSidebar(false);
                }
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const toggleDropdown = () => {
        setShowingNavigationDropdown(!showingNavigationDropdown);
    };

    const closeDropdown = () => {
        setShowingNavigationDropdown(false);
    };

    const toggleSidebar = () => {
        setSidebar(!sidebar);
    };

    const handleSignOut = () => {
        router.post("/logout");
        closeDropdown();
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <ToastContainer position="top-right" />

            <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
                <div className="px-3 py-3 lg:px-5 lg:pl-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-start rtl:justify-end">
                            <button
                                type="button"
                                onClick={toggleSidebar}
                                className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors duration-200"
                            >
                                <span className="sr-only">Open sidebar</span>
                                <Menu className="w-5 h-5" />
                            </button>
                            <Link
                                href="/dashboard"
                                className="flex ms-2 md:me-24"
                            >
                                <span className="self-center font-serif text-transparent bg-gradient-to-br bg-clip-text from-fuchsia-500 via-purple-400 to-blue-500 text-xl font-semibold sm:text-2xl whitespace-nowrap text-gray-900">
                                    SPK AHP TOPSIS
                                </span>
                            </Link>
                        </div>

                        <div className="flex items-center ">
                            <div className="flex items-center ms-3 relative">
                                <button
                                    onClick={toggleDropdown}
                                    type="button"
                                    className="flex px-3 text-sm rounded-full focus:ring-4 focus:ring-gray-300 hover:ring-4 hover:ring-gray-200 transition-all duration-200"
                                    aria-expanded={showingNavigationDropdown}
                                >
                                    Menu
                                    <span className="sr-only">
                                        Open user menu
                                    </span>
                                </button>

                                <div
                                    ref={dropdownRef}
                                    className={`z-50 ${
                                        showingNavigationDropdown
                                            ? "absolute"
                                            : "hidden"
                                    } my-4 text-base right-0 w-64 top-full list-none bg-white divide-y divide-gray-100 rounded-lg shadow-lg border border-gray-200`}
                                    id="dropdown-user"
                                >
                                    <div className="px-6 py-4" role="none">
                                        <p
                                            className="text-base text-gray-900 font-semibold"
                                            role="none"
                                        >
                                            {user.nama_lengkap}
                                        </p>
                                        <p
                                            className="text-sm text-gray-600 truncate"
                                            role="none"
                                        >
                                            {user.role}
                                        </p>
                                    </div>
                                    <ul className="py-2" role="none">
                                        <li>
                                            <Link
                                                href="/dashboard"
                                                className="flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                                                role="menuitem"
                                                onClick={closeDropdown}
                                            >
                                                <Dashboard className="w-4 h-4 mr-3" />
                                                Dashboard
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/profile"
                                                className="flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                                                role="menuitem"
                                                onClick={closeDropdown}
                                            >
                                                <Person className="w-4 h-4 mr-3" />
                                                Profile
                                            </Link>
                                        </li>
                                        <li>
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full text-left flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                                                role="menuitem"
                                            >
                                                <Logout className="w-4 h-4 mr-3" />
                                                Sign out
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <aside
                ref={sidebarRef}
                id="logo-sidebar"
                className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform duration-300 bg-white border-r border-gray-200 ${
                    sidebar ? "translate-x-0" : "-translate-x-full"
                } sm:translate-x-0`}
                aria-label="Sidebar"
            >
                <div className="h-full px-3 pb-4 overflow-y-auto bg-white">
                    <div className="flex gap-3 items-center py-3 border-t border-b border-gray-200">
                        <div className="p-3 rounded-xl   bg-gradient-to-br from-fuchsia-500 via-purple-400 to-blue-900">
                            <PieChart className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-gray-900 truncate">
                                {user.name}
                            </h3>
                            <p className="font-light text-gray-600 truncate">
                                {user.email}
                            </p>
                        </div>
                    </div>

                    <nav className="mt-6">
                        <ul className="font-medium">
                            {/* Semua Role */}
                            <SidebarItems
                                href="/dashboard"
                                active={route().current("dashboard")}
                                color="purple"
                                title="Dashboard"
                                icon={<Dashboard />}
                            />

                            <>
                                <SidebarItems
                                    href="/users"
                                    active={route().current("users.get")}
                                    color="purple"
                                    title="Users"
                                    icon={<Person />}
                                />
                                <SidebarItems
                                    href="/kriteria"
                                    active={route().current("kriteria.get")}
                                    color="purple"
                                    title="kriteria"
                                    icon={<FilterList />}
                                />
                                <SidebarItems
                                    href="/uploads"
                                    active={route().current("uploads.index")}
                                    color="purple"
                                    title="Alternative"
                                    icon={<PeopleTwoTone />}
                                />
                            </>
                        </ul>
                    </nav>
                </div>
            </aside>

            {sidebar && (
                <div
                    className="fixed inset-0 z-30 bg-black bg-opacity-50 sm:hidden transition-opacity duration-300"
                    onClick={() => setSidebar(false)}
                />
            )}

            <main
                className={`p-4 transition-all duration-300 ${
                    sidebar ? "sm:ml-64" : "sm:ml-64"
                }`}
            >
                <div className="py-16">{children}</div>
            </main>
        </div>
    );
}
