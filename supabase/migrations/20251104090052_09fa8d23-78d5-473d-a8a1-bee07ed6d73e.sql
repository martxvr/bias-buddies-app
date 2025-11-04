-- Create table for bias votes
CREATE TABLE public.room_bias_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  timeframe TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('agree', 'disagree')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(room_id, timeframe, user_id)
);

ALTER TABLE public.room_bias_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for room_bias_votes
CREATE POLICY "Users can view votes in their rooms"
  ON public.room_bias_votes FOR SELECT
  USING (
    public.is_room_owner(auth.uid(), room_id) OR
    public.is_room_member(auth.uid(), room_id)
  );

CREATE POLICY "Users can vote in their rooms"
  ON public.room_bias_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      public.is_room_owner(auth.uid(), room_id) OR
      public.is_room_member(auth.uid(), room_id)
    )
  );

CREATE POLICY "Users can update their own votes"
  ON public.room_bias_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.room_bias_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_bias_votes;