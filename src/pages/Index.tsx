import BiasButton from "@/components/BiasButton";

const Index = () => {
  const timeframes = ["1D", "4H", "1H", "15M", "5M"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-bold text-foreground">
            Trading Bias Tracker
          </h1>
          <p className="text-muted-foreground">
            Click buttons to cycle through market bias states
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          {timeframes.map((timeframe) => (
            <BiasButton key={timeframe} timeframe={timeframe} />
          ))}
        </div>

        <div className="mt-12 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-bullish"></div>
            <span className="text-foreground">Bullish</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-bearish"></div>
            <span className="text-foreground">Bearish</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-neutral"></div>
            <span className="text-foreground">Neutral</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
