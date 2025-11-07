-- Create room_messages table for chat
CREATE TABLE public.room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view messages in their rooms"
ON public.room_messages
FOR SELECT
USING (
  is_room_owner(auth.uid(), room_id) OR is_room_member(auth.uid(), room_id)
);

CREATE POLICY "Users can send messages in their rooms"
ON public.room_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  (is_room_owner(auth.uid(), room_id) OR is_room_member(auth.uid(), room_id))
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;

-- Create index for better performance
CREATE INDEX idx_room_messages_room_id ON public.room_messages(room_id);
CREATE INDEX idx_room_messages_created_at ON public.room_messages(created_at);