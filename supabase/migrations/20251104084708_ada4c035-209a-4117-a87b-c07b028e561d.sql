-- Create profiles table for user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text) from 1 for 8),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Create room_members table
CREATE TABLE public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Create room_bias table to store bias per timeframe per room
CREATE TABLE public.room_bias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  timeframe TEXT NOT NULL,
  bias_state TEXT NOT NULL CHECK (bias_state IN ('neutral', 'bullish', 'bearish')),
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE(room_id, timeframe)
);

ALTER TABLE public.room_bias ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for rooms
CREATE POLICY "Users can view their rooms"
  ON public.rooms FOR SELECT
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.room_members
      WHERE room_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update rooms"
  ON public.rooms FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete rooms"
  ON public.rooms FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for room_members
CREATE POLICY "Users can view room members"
  ON public.room_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE id = room_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.room_members rm
          WHERE rm.room_id = id AND rm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can join rooms"
  ON public.room_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON public.room_members FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for room_bias
CREATE POLICY "Users can view room bias"
  ON public.room_bias FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_id AND (
        r.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.room_members rm
          WHERE rm.room_id = r.id AND rm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Owners can update room bias"
  ON public.room_bias FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE id = room_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can modify room bias"
  ON public.room_bias FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE id = room_id AND owner_id = auth.uid()
    )
  );

-- Enable realtime for rooms and room_bias
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_bias;

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();