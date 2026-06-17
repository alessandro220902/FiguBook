import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface ButtonColorfulProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label?: string;
    showArrow?: boolean;
}

export function ButtonColorful({
    className,
    label = "Continua",
    showArrow = true,
    ...props
}: ButtonColorfulProps) {
    return (
        <Button
            className={cn(
                "relative h-11 px-5 overflow-hidden",
                "bg-secondary",
                "transition-all duration-200",
                "group",
                className
            )}
            {...props}
        >
            {/* Gradient background brand: lime -> pitch -> gold */}
            <div
                className={cn(
                    "absolute inset-0",
                    "bg-gradient-to-r from-lime via-secondary to-gold",
                    "opacity-70 group-hover:opacity-100",
                    "blur-[2px] transition-opacity duration-500"
                )}
            />

            {/* Content */}
            <div className="relative flex items-center justify-center gap-2">
                <span className="font-semibold text-lime-ink">{label}</span>
                {showArrow && (
                    <ArrowRight className="w-4 h-4 text-lime-ink transition-transform group-hover:translate-x-0.5" />
                )}
            </div>
        </Button>
    );
}
