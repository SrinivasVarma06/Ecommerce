import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Clock, AlertCircle, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { priceTrackingAPI } from '@/services/api';

const PricePrediction = ({ productId, currentPrice }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalysis();
  }, [productId]);

  const loadAnalysis = async () => {
    try {
      const data = await priceTrackingAPI.getAnalysis(productId);
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to load price analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading price analysis...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'buy_now':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'wait':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getRecommendationIcon = (recommendation) => {
    switch (recommendation) {
      case 'buy_now':
        return <TrendingDown className="w-5 h-5" />;
      case 'wait':
        return <Clock className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getRecommendationText = (recommendation) => {
    switch (recommendation) {
      case 'buy_now':
        return 'Great Time to Buy!';
      case 'wait':
        return 'Consider Waiting';
      default:
        return 'Monitor Price';
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Recommendation Card */}
      <Card className={`border-2 ${getRecommendationColor(analysis.recommendation)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getRecommendationIcon(analysis.recommendation)}
              {getRecommendationText(analysis.recommendation)}
            </CardTitle>
            <Badge variant="secondary">
              {analysis.confidence}% Confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.savings > 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <DollarSign className="w-5 h-5" />
                <span className="font-semibold">
                  Save ${analysis.savings} ({analysis.priceDropPercentage}% off average price)
                </span>
              </div>
            )}
            
            {analysis.prediction === 'at_lowest' && (
              <div className="flex items-center gap-2 text-green-600">
                <TrendingDown className="w-5 h-5" />
                <span className="font-semibold">
                  Currently at lowest price in 30 days!
                </span>
              </div>
            )}

            {analysis.bestDayToBuy && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Historically, prices are lowest on {analysis.bestDayToBuy}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Lowest</p>
              <p className="text-lg font-bold text-green-600">
                ${analysis.lowestPrice.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Average</p>
              <p className="text-lg font-bold">
                ${analysis.averagePrice.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Highest</p>
              <p className="text-lg font-bold text-red-600">
                ${analysis.highestPrice.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Trend Chart */}
      {analysis.chartData && analysis.chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">30-Day Price Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.chartData.slice(-10).map((item, index) => {
                const maxPrice = Math.max(...analysis.chartData.map(d => d.price));
                const minPrice = Math.min(...analysis.chartData.map(d => d.price));
                const percentage = ((item.price - minPrice) / (maxPrice - minPrice)) * 100;
                
                const isLowest = item.price === analysis.lowestPrice;
                const isHighest = item.price === analysis.highestPrice;
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{item.date}</span>
                      <span className={`font-semibold ${
                        isLowest ? 'text-green-600' : isHighest ? 'text-red-600' : ''
                      }`}>
                        ${item.price.toFixed(2)}
                        {isLowest && ' 🎯'}
                        {isHighest && ' 📈'}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className={`h-1.5 rounded-full ${
                          isLowest 
                            ? 'bg-green-500' 
                            : isHighest 
                            ? 'bg-red-500' 
                            : 'bg-primary'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Info */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">
                AI Price Prediction
              </p>
              <p>
                Our AI analyzes 30 days of price history to predict trends and help you save money. 
                {analysis.trend === 'increasing' && ' Price is currently trending up.'}
                {analysis.trend === 'decreasing' && ' Price is currently trending down.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricePrediction;
