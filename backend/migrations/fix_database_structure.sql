-- Database Structure Fixes
-- This migration fixes various issues in the database schema

-- 1. Fix the camps table - assigned_to column should be integer array, not just ARRAY
ALTER TABLE public.camps 
ALTER COLUMN assigned_to TYPE integer[] USING assigned_to::integer[];

-- 2. Add CHECK constraint for service_status in client_service_items
ALTER TABLE public.client_service_items 
ADD CONSTRAINT client_service_items_service_status_check 
CHECK (service_status IS NULL OR service_status IN ('approved', 'rejected', 'pending'));

-- 3. Add missing foreign key constraints
-- Add created_by to client_services table
ALTER TABLE public.client_services 
ADD COLUMN created_by integer;

ALTER TABLE public.client_services 
ADD CONSTRAINT client_services_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id);

-- Add created_by to client_service_items table
ALTER TABLE public.client_service_items 
ADD COLUMN created_by integer;

ALTER TABLE public.client_service_items 
ADD CONSTRAINT client_service_items_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id);

-- 4. Add missing foreign key constraints for meeseva table
ALTER TABLE public.meeseva 
ADD CONSTRAINT meeseva_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE public.meeseva 
ADD CONSTRAINT meeseva_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES public.users(id);

-- 5. Add proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_services_created_by ON public.client_services(created_by);
CREATE INDEX IF NOT EXISTS idx_client_services_created_at ON public.client_services(created_at);
CREATE INDEX IF NOT EXISTS idx_client_service_items_client_service_id ON public.client_service_items(client_service_id);
CREATE INDEX IF NOT EXISTS idx_client_service_items_created_by ON public.client_service_items(created_by);
CREATE INDEX IF NOT EXISTS idx_client_service_items_service_status ON public.client_service_items(service_status);
CREATE INDEX IF NOT EXISTS idx_camps_assigned_to ON public.camps USING GIN(assigned_to);
CREATE INDEX IF NOT EXISTS idx_camps_status ON public.camps(status);
CREATE INDEX IF NOT EXISTS idx_camps_created_by ON public.camps(created_by);
CREATE INDEX IF NOT EXISTS idx_claims_card_id ON public.claims(card_id);
CREATE INDEX IF NOT EXISTS idx_claims_created_by ON public.claims(created_by);
CREATE INDEX IF NOT EXISTS idx_claims_process_state ON public.claims(process_state);
CREATE INDEX IF NOT EXISTS idx_cards_customer_id ON public.cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_cards_created_by ON public.cards(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON public.customers(created_by);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_transaction_date ON public.financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_meeseva_created_by ON public.meeseva(created_by);
CREATE INDEX IF NOT EXISTS idx_meeseva_updated_by ON public.meeseva(updated_by);

-- 6. Add NOT NULL constraints where appropriate
ALTER TABLE public.client_services 
ALTER COLUMN establishment_name SET NOT NULL;

ALTER TABLE public.client_services 
ALTER COLUMN employer_name SET NOT NULL;

-- 7. Add default values for created_by columns
ALTER TABLE public.client_services 
ALTER COLUMN created_by SET DEFAULT 1; -- Assuming admin user has ID 1

ALTER TABLE public.client_service_items 
ALTER COLUMN created_by SET DEFAULT 1; -- Assuming admin user has ID 1

-- 8. Update existing records to have created_by values (if any exist)
UPDATE public.client_services 
SET created_by = 1 
WHERE created_by IS NULL;

UPDATE public.client_service_items 
SET created_by = 1 
WHERE created_by IS NULL;

-- 9. Add comments for documentation
COMMENT ON TABLE public.client_services IS 'Client establishments and their basic information';
COMMENT ON TABLE public.client_service_items IS 'Individual services provided to clients';
COMMENT ON COLUMN public.client_service_items.service_status IS 'Status of the service: approved, rejected, or pending';
COMMENT ON COLUMN public.camps.assigned_to IS 'Array of user IDs assigned to this camp';
COMMENT ON COLUMN public.camps.status IS 'Camp status: planned, ongoing, completed, or cancelled';

-- 10. Add triggers for updated_at columns (if not already present)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables that need them
DROP TRIGGER IF EXISTS update_client_services_updated_at ON public.client_services;
CREATE TRIGGER update_client_services_updated_at 
    BEFORE UPDATE ON public.client_services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_service_items_updated_at ON public.client_service_items;
CREATE TRIGGER update_client_service_items_updated_at 
    BEFORE UPDATE ON public.client_service_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON public.financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at 
    BEFORE UPDATE ON public.financial_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeseva_updated_at ON public.meeseva;
CREATE TRIGGER update_meeseva_updated_at 
    BEFORE UPDATE ON public.meeseva 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
