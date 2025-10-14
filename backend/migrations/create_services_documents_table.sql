-- Create services_documents table
CREATE TABLE public.services_documents (
    id bigserial NOT NULL,
    service_id bigint NOT NULL,
    document_url text NOT NULL,
    file_name character varying(255) NOT NULL,
    file_size bigint NULL,
    mime_type character varying(100) NULL,
    uploaded_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    user_id character varying(255) NULL,
    created_by character varying(255) NULL,
    CONSTRAINT services_documents_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Add foreign key constraint to client_service_items table
ALTER TABLE public.services_documents 
ADD CONSTRAINT fk_services_documents_service_id 
FOREIGN KEY (service_id) 
REFERENCES public.client_service_items(id) 
ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX idx_services_documents_service_id ON public.services_documents(service_id);
CREATE INDEX idx_services_documents_uploaded_at ON public.services_documents(uploaded_at);
CREATE INDEX idx_services_documents_user_id ON public.services_documents(user_id);

-- Add comments for documentation
COMMENT ON TABLE public.services_documents IS 'Stores document uploads associated with client service items';
COMMENT ON COLUMN public.services_documents.service_id IS 'Foreign key to client_service_items table';
COMMENT ON COLUMN public.services_documents.document_url IS 'Supabase storage URL for the uploaded document';
COMMENT ON COLUMN public.services_documents.file_name IS 'Original filename of the uploaded document';
COMMENT ON COLUMN public.services_documents.file_size IS 'Size of the file in bytes';
COMMENT ON COLUMN public.services_documents.mime_type IS 'MIME type of the uploaded file';
COMMENT ON COLUMN public.services_documents.uploaded_at IS 'Timestamp when the document was uploaded';
COMMENT ON COLUMN public.services_documents.user_id IS 'ID of the user who uploaded the document';
COMMENT ON COLUMN public.services_documents.created_by IS 'Username or identifier of who created the record';
