-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view room members" ON public.room_members;
DROP POLICY IF EXISTS "Users can view their rooms" ON public.rooms;

-- Create security definer function to check room membership
CREATE OR REPLACE FUNCTION public.is_room_member(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members
    WHERE user_id = _user_id
      AND room_id = _room_id
  );
$$;

-- Create security definer function to check room ownership
CREATE OR REPLACE FUNCTION public.is_room_owner(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.rooms
    WHERE id = _room_id
      AND owner_id = _user_id
  );
$$;

-- Recreate rooms policy using security definer function
CREATE POLICY "Users can view their rooms"
  ON public.rooms FOR SELECT
  USING (
    auth.uid() = owner_id OR
    public.is_room_member(auth.uid(), id)
  );

-- Recreate room_members policy using security definer function
CREATE POLICY "Users can view room members"
  ON public.room_members FOR SELECT
  USING (
    public.is_room_owner(auth.uid(), room_id) OR
    public.is_room_member(auth.uid(), room_id)
  );