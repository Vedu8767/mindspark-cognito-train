import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Lightbulb } from 'lucide-react';
import { AIInsight } from '@/lib/aiInsights';

interface AIInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insights: AIInsight[];
}

const AIInsightsModal = ({ open, onOpenChange, insights }: AIInsightsModalProps) => {
  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'strength':
        return <Target className="h-5 w-5 text-success" />;
      case 'improvement':
        return <TrendingDown className="h-5 w-5 text-destructive" />;
      case 'trend':
        return <TrendingUp className="h-5 w-5 text-primary" />;
      case 'prediction':
        return <Lightbulb className="h-5 w-5 text-accent" />;
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'strength':
        return 'bg-success/10 text-success border-success/20';
      case 'improvement':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'trend':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'prediction':
        return 'bg-accent/10 text-accent border-accent/20';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-accent" />
            AI Cognitive Insights
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className="glass-card p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{insight.title}</h3>
                    <Badge className={getInsightColor(insight.type)}>
                      {insight.type}
                    </Badge>
                    <Badge variant="outline">
                      {insight.score.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{insight.description}</p>
                  {insight.recommendation && (
                    <div className="p-3 bg-accent/5 rounded-lg border border-accent/20">
                      <p className="text-sm text-foreground">
                        <strong>Recommendation:</strong> {insight.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {insights.length === 0 && (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Keep training to unlock AI insights about your cognitive performance!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIInsightsModal;