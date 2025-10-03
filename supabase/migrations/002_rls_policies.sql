-- Enable Row Level Security on all tables
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is a member of a trip
CREATE OR REPLACE FUNCTION is_trip_member(trip_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM trip_members
        WHERE trip_id = trip_uuid
        AND user_id = user_uuid
    );
$$;

-- Helper function to check if user is trip organizer
CREATE OR REPLACE FUNCTION is_trip_organizer(trip_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM trip_members
        WHERE trip_id = trip_uuid
        AND user_id = user_uuid
        AND role = 'organizer'
    );
$$;

-- Helper function to get trip_id from any related table
CREATE OR REPLACE FUNCTION get_trip_id_from_day(day_uuid UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT trip_id FROM days WHERE id = day_uuid;
$$;

CREATE OR REPLACE FUNCTION get_trip_id_from_block(block_uuid UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT d.trip_id FROM days d
    JOIN blocks b ON b.day_id = d.id
    WHERE b.id = block_uuid;
$$;

CREATE OR REPLACE FUNCTION get_trip_id_from_activity(activity_uuid UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT trip_id FROM activities WHERE id = activity_uuid;
$$;

-- Trips policies
CREATE POLICY "Users can view trips they are members of" ON trips
    FOR SELECT USING (is_trip_member(id, auth.uid()));

CREATE POLICY "Organizers can update their trips" ON trips
    FOR UPDATE USING (is_trip_organizer(id, auth.uid()));

CREATE POLICY "Anyone can create trips" ON trips
    FOR INSERT WITH CHECK (true);

-- Trip members policies
CREATE POLICY "Users can view trip members for trips they belong to" ON trip_members
    FOR SELECT USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Users can join trips via invite" ON trip_members
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Organizers can remove members" ON trip_members
    FOR DELETE USING (is_trip_organizer(trip_id, auth.uid()));

-- Days policies
CREATE POLICY "Trip members can view days" ON days
    FOR SELECT USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can create days" ON days
    FOR INSERT WITH CHECK (is_trip_member(trip_id, auth.uid()));

-- Blocks policies
CREATE POLICY "Trip members can view blocks" ON blocks
    FOR SELECT USING (is_trip_member(get_trip_id_from_day(day_id), auth.uid()));

CREATE POLICY "Trip members can update blocks" ON blocks
    FOR UPDATE USING (is_trip_member(get_trip_id_from_day(day_id), auth.uid()));

CREATE POLICY "Trip members can create blocks" ON blocks
    FOR INSERT WITH CHECK (is_trip_member(get_trip_id_from_day(day_id), auth.uid()));

-- Activities policies
CREATE POLICY "Trip members can view activities" ON activities
    FOR SELECT USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can create activities" ON activities
    FOR INSERT WITH CHECK (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can update activities" ON activities
    FOR UPDATE USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can delete activities" ON activities
    FOR DELETE USING (is_trip_member(trip_id, auth.uid()));

-- Activity photos policies
CREATE POLICY "Trip members can view activity photos" ON activity_photos
    FOR SELECT USING (is_trip_member(get_trip_id_from_activity(activity_id), auth.uid()));

CREATE POLICY "Trip members can add activity photos" ON activity_photos
    FOR INSERT WITH CHECK (is_trip_member(get_trip_id_from_activity(activity_id), auth.uid()));

CREATE POLICY "Trip members can delete activity photos" ON activity_photos
    FOR DELETE USING (is_trip_member(get_trip_id_from_activity(activity_id), auth.uid()));

-- Block proposals policies
CREATE POLICY "Trip members can view proposals" ON block_proposals
    FOR SELECT USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can create proposals" ON block_proposals
    FOR INSERT WITH CHECK (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can delete their proposals" ON block_proposals
    FOR DELETE USING (is_trip_member(trip_id, auth.uid()) AND created_by IN (
        SELECT id FROM trip_members WHERE trip_id = block_proposals.trip_id AND user_id = auth.uid()
    ));

-- Votes policies
CREATE POLICY "Trip members can view votes" ON votes
    FOR SELECT USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can cast votes" ON votes
    FOR INSERT WITH CHECK (is_trip_member(trip_id, auth.uid()) AND member_id IN (
        SELECT id FROM trip_members WHERE trip_id = votes.trip_id AND user_id = auth.uid()
    ));

CREATE POLICY "Trip members can update their votes" ON votes
    FOR UPDATE USING (is_trip_member(trip_id, auth.uid()) AND member_id IN (
        SELECT id FROM trip_members WHERE trip_id = votes.trip_id AND user_id = auth.uid()
    ));

CREATE POLICY "Trip members can delete their votes" ON votes
    FOR DELETE USING (is_trip_member(trip_id, auth.uid()) AND member_id IN (
        SELECT id FROM trip_members WHERE trip_id = votes.trip_id AND user_id = auth.uid()
    ));

-- Commits policies
CREATE POLICY "Trip members can view commits" ON commits
    FOR SELECT USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Organizers can create commits" ON commits
    FOR INSERT WITH CHECK (is_trip_organizer(trip_id, auth.uid()));

-- Bookings policies
CREATE POLICY "Trip members can view bookings" ON bookings
    FOR SELECT USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can create bookings" ON bookings
    FOR INSERT WITH CHECK (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can update bookings" ON bookings
    FOR UPDATE USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can delete bookings" ON bookings
    FOR DELETE USING (is_trip_member(trip_id, auth.uid()));

-- Expenses policies
CREATE POLICY "Trip members can view expenses" ON expenses
    FOR SELECT USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can create expenses" ON expenses
    FOR INSERT WITH CHECK (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can update expenses" ON expenses
    FOR UPDATE USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can delete expenses" ON expenses
    FOR DELETE USING (is_trip_member(trip_id, auth.uid()));

-- Expense splits policies
CREATE POLICY "Trip members can view expense splits" ON expense_splits
    FOR SELECT USING (is_trip_member(
        (SELECT trip_id FROM expenses WHERE id = expense_splits.expense_id),
        auth.uid()
    ));

CREATE POLICY "Trip members can create expense splits" ON expense_splits
    FOR INSERT WITH CHECK (is_trip_member(
        (SELECT trip_id FROM expenses WHERE id = expense_splits.expense_id),
        auth.uid()
    ));

CREATE POLICY "Trip members can update expense splits" ON expense_splits
    FOR UPDATE USING (is_trip_member(
        (SELECT trip_id FROM expenses WHERE id = expense_splits.expense_id),
        auth.uid()
    ));

CREATE POLICY "Trip members can delete expense splits" ON expense_splits
    FOR DELETE USING (is_trip_member(
        (SELECT trip_id FROM expenses WHERE id = expense_splits.expense_id),
        auth.uid()
    ));

-- Checklists policies
CREATE POLICY "Trip members can view checklists" ON checklists
    FOR SELECT USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can create checklists" ON checklists
    FOR INSERT WITH CHECK (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can update checklists" ON checklists
    FOR UPDATE USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can delete checklists" ON checklists
    FOR DELETE USING (is_trip_member(trip_id, auth.uid()));

-- Checklist items policies
CREATE POLICY "Trip members can view checklist items" ON checklist_items
    FOR SELECT USING (is_trip_member(
        (SELECT trip_id FROM checklists WHERE id = checklist_items.checklist_id),
        auth.uid()
    ));

CREATE POLICY "Trip members can create checklist items" ON checklist_items
    FOR INSERT WITH CHECK (is_trip_member(
        (SELECT trip_id FROM checklists WHERE id = checklist_items.checklist_id),
        auth.uid()
    ));

CREATE POLICY "Trip members can update checklist items" ON checklist_items
    FOR UPDATE USING (is_trip_member(
        (SELECT trip_id FROM checklists WHERE id = checklist_items.checklist_id),
        auth.uid()
    ));

CREATE POLICY "Trip members can delete checklist items" ON checklist_items
    FOR DELETE USING (is_trip_member(
        (SELECT trip_id FROM checklists WHERE id = checklist_items.checklist_id),
        auth.uid()
    ));

-- Comments policies
CREATE POLICY "Trip members can view comments" ON comments
    FOR SELECT USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can create comments" ON comments
    FOR INSERT WITH CHECK (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Authors can update their comments" ON comments
    FOR UPDATE USING (is_trip_member(trip_id, auth.uid()) AND author_member_id IN (
        SELECT id FROM trip_members WHERE trip_id = comments.trip_id AND user_id = auth.uid()
    ));

CREATE POLICY "Authors can delete their comments" ON comments
    FOR DELETE USING (is_trip_member(trip_id, auth.uid()) AND author_member_id IN (
        SELECT id FROM trip_members WHERE trip_id = comments.trip_id AND user_id = auth.uid()
    ));