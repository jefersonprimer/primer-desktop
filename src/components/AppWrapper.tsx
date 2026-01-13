import type { ReactNode } from "react";
// import { useDockVisibility } from "../contexts/DockVisibilityContext";

interface AppWrapperProps {
    children: ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
    // const { isFocusMode } = useDockVisibility();

    return (
        <div className={`w-full max-w-[1440px] mx-auto min-h-screen md:h-screen relative overflow-y-auto md:overflow-hidden`}>
            {children}
        </div>
    );
}
