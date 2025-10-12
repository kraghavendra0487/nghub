import csv
import json
import sys
import os
from datetime import datetime

def validate_row(row, row_number):
    """Validate a single row of client data"""
    errors = []
    
    # Required fields validation
    required_fields = ['establishment_name', 'employer_name', 'email_id', 'mobile_number']
    
    for field in required_fields:
        if not row.get(field) or row[field].strip() == '':
            errors.append(f"Row {row_number}: {field.replace('_', ' ').title()} is required")
    
    # Email validation (basic)
    email = row.get('email_id', '').strip()
    if email and '@' not in email:
        errors.append(f"Row {row_number}: Email ID must contain '@' symbol")
    
    # Mobile number validation (basic)
    mobile = row.get('mobile_number', '').strip()
    if mobile and not mobile.isdigit():
        errors.append(f"Row {row_number}: Mobile number must contain only digits")
    
    return errors

def parse_csv_file(file_path):
    """Parse CSV file and return validated data with errors"""
    if not os.path.exists(file_path):
        return {
            'success': False,
            'error': f'CSV file not found at path: {file_path}',
            'data': [],
            'errors': []
        }

    try:
        # Parse CSV file
        with open(file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            # Check if required columns exist (with flexible matching)
            required_columns = ['establishment_name', 'employer_name', 'email_id', 'mobile_number']
            if not csv_reader.fieldnames:
                return {
                    'success': False,
                    'error': 'CSV file appears to be empty or invalid',
                    'data': [],
                    'errors': []
                }
            
            # Create column mapping for flexible matching
            column_mapping = {}
            available_columns = [col.lower().strip() for col in csv_reader.fieldnames]
            
            # Map required columns to available columns (case-insensitive)
            for required_col in required_columns:
                found = False
                for available_col in available_columns:
                    if required_col.lower() in available_col or available_col in required_col.lower():
                        # Find the original column name
                        for orig_col in csv_reader.fieldnames:
                            if orig_col.lower().strip() == available_col:
                                column_mapping[required_col] = orig_col
                                found = True
                                break
                        if found:
                            break
                
                if not found:
                    # Try common variations
                    variations = {
                        'establishment_name': ['company', 'business', 'organization', 'firm', 'establishment'],
                        'employer_name': ['employer', 'owner', 'manager', 'contact person', 'name'],
                        'email_id': ['email', 'e-mail', 'mail', 'email address'],
                        'mobile_number': ['mobile', 'phone', 'contact', 'number', 'telephone']
                    }
                    
                    for variation in variations.get(required_col, []):
                        for orig_col in csv_reader.fieldnames:
                            if variation.lower() in orig_col.lower():
                                column_mapping[required_col] = orig_col
                                found = True
                                break
                        if found:
                            break
            
            missing_columns = [col for col in required_columns if col not in column_mapping]
            if missing_columns:
                return {
                    'success': False,
                    'error': f'Missing required columns: {", ".join(missing_columns)}. Available columns: {", ".join(csv_reader.fieldnames)}',
                    'data': [],
                    'errors': []
                }
            
            # Process rows
            valid_rows = []
            all_errors = []
            row_number = 1
            
            for row in csv_reader:
                row_number += 1
                
                # Map the row data using column mapping
                mapped_row = {}
                for required_col, actual_col in column_mapping.items():
                    mapped_row[required_col] = row.get(actual_col, '').strip()
                
                # Validate row
                row_errors = validate_row(mapped_row, row_number)
                
                if row_errors:
                    all_errors.extend(row_errors)
                else:
                    # Clean and prepare valid data
                    valid_row = {
                        'establishment_name': mapped_row['establishment_name'],
                        'employer_name': mapped_row['employer_name'],
                        'email_id': mapped_row['email_id'],
                        'mobile_number': mapped_row['mobile_number']
                    }
                    valid_rows.append(valid_row)
            
            return {
                'success': True,
                'data': valid_rows,
                'errors': all_errors
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': f'Error parsing CSV file: {str(e)}',
            'data': [],
            'errors': []
        }

def main():
    """Main function to parse CSV file from command line argument"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'No file path provided',
            'data': [],
            'errors': []
        }))
        sys.exit(1)
    
    file_path = sys.argv[1]
    result = parse_csv_file(file_path)
    
    # Output result as JSON
    print(json.dumps(result))

if __name__ == '__main__':
    main()
