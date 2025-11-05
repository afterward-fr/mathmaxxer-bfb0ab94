import { Trophy, Medal, Award, Crown, Star, Target, Zap, Flame, Brain, Sparkles, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked_at?: string;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
}

const iconMap: Record<string, any> = {
  trophy: Trophy,
  medal: Medal,
  award: Award,
  crown: Crown,
  star: Star,
  target: Target,
  zap: Zap,
  flame: Flame,
  brain: Brain,
  sparkles: Sparkles,
  "trending-up": TrendingUp,
};

const AchievementBadge = ({ achievement, unlocked }: AchievementBadgeProps) => {
  const IconComponent = iconMap[achievement.icon] || Trophy;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={`p-4 text-center transition-all cursor-pointer ${
              unlocked
                ? "bg-primary/20 border-primary/50 hover:bg-primary/30"
                : "bg-secondary/30 border-secondary/50 opacity-50 grayscale"
            }`}
          >
            <IconComponent
              className={`w-10 h-10 mx-auto mb-2 ${
                unlocked ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <h4 className="font-bold text-sm mb-1 line-clamp-1">{achievement.name}</h4>
            {unlocked && achievement.unlocked_at && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(achievement.unlocked_at), "MMM dd, yyyy")}
              </p>
            )}
            {!unlocked && (
              <p className="text-xs text-muted-foreground">Locked</p>
            )}
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-bold">{achievement.name}</p>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
            {unlocked && achievement.unlocked_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Unlocked on {format(new Date(achievement.unlocked_at), "MMMM dd, yyyy")}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AchievementBadge;
