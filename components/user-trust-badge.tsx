import { Shield, ShieldCheck, ShieldAlert, Award } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UserTrustBadgeProps {
    score: number
    size?: "sm" | "md" | "lg"
}

export function UserTrustBadge({ score, size = "md" }: UserTrustBadgeProps) {
    let icon = <Shield className={size === "lg" ? "h-8 w-8" : size === "md" ? "h-5 w-5" : "h-3 w-3"} />
    let label = "New Member"
    let color = "text-slate-500"
    let bg = "bg-slate-100"

    if (score >= 100) {
        icon = <Award className={size === "lg" ? "h-8 w-8" : size === "md" ? "h-5 w-5" : "h-3 w-3"} />
        label = "Community Hero"
        color = "text-purple-600"
        bg = "bg-purple-100"
    } else if (score >= 50) {
        icon = <ShieldCheck className={size === "lg" ? "h-8 w-8" : size === "md" ? "h-5 w-5" : "h-3 w-3"} />
        label = "Trusted Finder"
        color = "text-green-600"
        bg = "bg-green-100"
    } else if (score >= 10) {
        icon = <ShieldCheck className={size === "lg" ? "h-8 w-8" : size === "md" ? "h-5 w-5" : "h-3 w-3"} />
        label = "Verified Member"
        color = "text-blue-600"
        bg = "bg-blue-100"
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${bg} ${color} font-medium text-xs cursor-help`}>
                        {icon}
                        <span>{label}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Trust Score: {score}</p>
                    <p className="text-xs text-muted-foreground mt-1">Earn points by returning items!</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
