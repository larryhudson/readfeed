ALTER TABLE document_files ADD `pdf_data_original_file_path` text;--> statement-breakpoint
ALTER TABLE document_files ADD `pdf_data_file_path` text;--> statement-breakpoint
ALTER TABLE `content_items` DROP COLUMN `pdf_extraction_json_file_path`;