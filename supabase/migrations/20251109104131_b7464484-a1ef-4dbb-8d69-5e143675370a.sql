-- Friendships/Followers table
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships"
ON public.friendships FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendship requests"
ON public.friendships FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships"
ON public.friendships FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete friendships"
ON public.friendships FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Direct Messages table
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages"
ON public.direct_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.direct_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read"
ON public.direct_messages FOR UPDATE
USING (auth.uid() = receiver_id);

-- Room Sessions (history)
CREATE TABLE public.room_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  short_term_bias TEXT,
  medium_term_bias TEXT,
  long_term_bias TEXT,
  participants_count INTEGER DEFAULT 0
);

ALTER TABLE public.room_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sessions of their rooms"
ON public.room_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM rooms r 
    WHERE r.id = room_sessions.room_id 
    AND (r.owner_id = auth.uid() OR is_room_member(auth.uid(), r.id))
  )
);

CREATE POLICY "Owners can create sessions"
ON public.room_sessions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM rooms r 
    WHERE r.id = room_sessions.room_id 
    AND r.owner_id = auth.uid()
  )
);

-- User Stats
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_votes INTEGER DEFAULT 0,
  rooms_visited INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all stats"
ON public.user_stats FOR SELECT
USING (true);

CREATE POLICY "Users can update own stats"
ON public.user_stats FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stats"
ON public.user_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Achievements
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- voting, social, activity, milestone
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view achievements"
ON public.achievements FOR SELECT
USING (true);

-- User Achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all user achievements"
ON public.user_achievements FOR SELECT
USING (true);

CREATE POLICY "Users can unlock own achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Favorite Rooms
CREATE TABLE public.favorite_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, room_id)
);

ALTER TABLE public.favorite_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
ON public.favorite_rooms FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON public.favorite_rooms FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
ON public.favorite_rooms FOR DELETE
USING (auth.uid() = user_id);

-- Scheduled Sessions
CREATE TABLE public.scheduled_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scheduled sessions for their rooms"
ON public.scheduled_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM rooms r 
    WHERE r.id = scheduled_sessions.room_id 
    AND (r.owner_id = auth.uid() OR is_room_member(auth.uid(), r.id))
  )
);

CREATE POLICY "Owners can create scheduled sessions"
ON public.scheduled_sessions FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM rooms r 
    WHERE r.id = scheduled_sessions.room_id 
    AND r.owner_id = auth.uid()
  )
);

-- User Preferences (for custom themes and notifications)
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  custom_theme JSONB,
  notification_settings JSONB DEFAULT '{"friend_requests": true, "messages": true, "scheduled_sessions": true, "achievements": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
ON public.user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON public.user_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences"
ON public.user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Extend profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS favorite_bias TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_value) VALUES
('first_vote', 'Cast je eerste vote', 'vote', 'voting', 1),
('voter_10', 'Cast 10 votes', 'trophy', 'voting', 10),
('voter_100', 'Cast 100 votes', 'award', 'voting', 100),
('room_explorer', 'Bezoek 10 verschillende rooms', 'map', 'activity', 10),
('social_butterfly', 'Maak 5 vrienden', 'users', 'social', 5),
('streak_7', 'Behoud een 7-daagse streak', 'flame', 'activity', 7),
('streak_30', 'Behoud een 30-daagse streak', 'zap', 'activity', 30),
('first_friend', 'Maak je eerste vriend', 'user-plus', 'social', 1),
('room_creator', 'Maak je eerste room', 'plus-circle', 'milestone', 1);

-- Enable realtime for direct messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;