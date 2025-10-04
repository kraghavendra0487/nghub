import csv
import json
import sys
import os
from datetime import datetime

def validate_row(row, row_number):
    """Validate a single row of customer data"""
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
            
            # Check if required columns exist
            required_columns = ['establishment_name', 'employer_name', 'email_id', 'mobile_number']
            if not csv_reader.fieldnames:
                return {
                    'success': False,
                    'error': 'CSV file appears to be empty or invalid',
                    'data': [],
                    'errors': []
                }
            
            missing_columns = [col for col in required_columns if col not in csv_reader.fieldnames]
            if missing_columns:
                return {
                    'success': False,
                    'error': f'Missing required columns: {", ".join(missing_columns)}',
                    'data': [],
                    'errors': []
                }
            
            # Process rows
            valid_rows = []
            all_errors = []
            row_number = 1
            
            for row in csv_reader:
                row_number += 1
                
                # Validate row
                row_errors = validate_row(row, row_number)
                
                if row_errors:
                    all_errors.extend(row_errors)
                else:
                    # Clean and prepare valid data
                    valid_row = {
                        'establishment_name': row['establishment_name'].strip(),
                        'employer_name': row['employer_name'].strip(),
                        'email_id': row['email_id'].strip(),
                        'mobile_number': row['mobile_number'].strip()
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
