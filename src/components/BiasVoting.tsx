import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BiasVotingProps {
  roomId: string;
  timeframe: string;
  userId: string;
}

export function BiasVoting({ roomId, timeframe, userId }: BiasVotingProps) {
  const [agreeCount, setAgreeCount] = useState(0);
  const [disagreeCount, setDisagreeCount] = useState(0);
  const [userVote, setUserVote] = useState<"agree" | "disagree" | null>(null);

  const loadVotes = async () => {
    const { data: votes } = await supabase
      .from("room_bias_votes")
      .select("*")
      .eq("room_id", roomId)
      .eq("timeframe", timeframe);

    if (votes) {
      setAgreeCount(votes.filter((v) => v.vote_type === "agree").length);
      setDisagreeCount(votes.filter((v) => v.vote_type === "disagree").length);
      const userVoteData = votes.find((v) => v.user_id === userId);
      setUserVote(userVoteData?.vote_type as "agree" | "disagree" | null);
    }
  };

  useEffect(() => {
    loadVotes();

    const channel = supabase
      .channel(`votes:${roomId}:${timeframe}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_bias_votes",
          filter: `room_id=eq.${roomId}`,
        },
        () => loadVotes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, timeframe, userId]);

  const handleVote = async (voteType: "agree" | "disagree") => {
    try {
      if (userVote === voteType) {
        // Remove vote
        await supabase
          .from("room_bias_votes")
          .delete()
          .eq("room_id", roomId)
          .eq("timeframe", timeframe)
          .eq("user_id", userId);
        setUserVote(null);
      } else if (userVote) {
        // Update vote
        await supabase
          .from("room_bias_votes")
          .update({ vote_type: voteType })
          .eq("room_id", roomId)
          .eq("timeframe", timeframe)
          .eq("user_id", userId);
        setUserVote(voteType);
      } else {
        // Insert new vote
        await supabase.from("room_bias_votes").insert({
          room_id: roomId,
          timeframe: timeframe,
          user_id: userId,
          vote_type: voteType,
        });
        setUserVote(voteType);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to vote");
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <button
        onClick={() => handleVote("agree")}
        className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${
          userVote === "agree"
            ? "bg-green-500/20 text-green-600 dark:text-green-400"
            : "hover:bg-muted"
        }`}
      >
        <ThumbsUp className="h-3 w-3" />
        <span>{agreeCount}</span>
      </button>
      <button
        onClick={() => handleVote("disagree")}
        className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${
          userVote === "disagree"
            ? "bg-red-500/20 text-red-600 dark:text-red-400"
            : "hover:bg-muted"
        }`}
      >
        <ThumbsDown className="h-3 w-3" />
        <span>{disagreeCount}</span>
      </button>
    </div>
  );
}
