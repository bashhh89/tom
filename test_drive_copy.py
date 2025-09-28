from google.oauth2 import service_account
from googleapiclient.discovery import build

# --- Configuration ---
SERVICE_ACCOUNT_FILE = 'service_account.json'  # Replace with the actual path to your JSON key file
TEMPLATE_ID = '1TCcTPbppLeT6wOA3poYg_NwyzDDQfbe4OAJBn5KfmXw'
NEW_FILE_NAME = 'Test Copy from Script'
# If you want to copy to a specific folder, uncomment the next line and provide the folder ID
# PARENT_FOLDER_ID = 'your_folder_id'

# --- Scopes ---
SCOPES = ['https://www.googleapis.com/auth/drive']

# --- Authentication ---
creds = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES)

# --- API Client ---
try:
    drive_service = build('drive', 'v3', credentials=creds)

    # --- Copy File ---
    print(f"Attempting to copy file with ID: {TEMPLATE_ID}")
    file_metadata = {
        'name': NEW_FILE_NAME
    }
    # If you are copying to a specific folder, add the parent folder ID to the metadata
    # if 'PARENT_FOLDER_ID' in locals():
    #     file_metadata['parents'] = [PARENT_FOLDER_ID]

    copied_file = drive_service.files().copy(
        fileId=TEMPLATE_ID,
        body=file_metadata,
        fields='id, name, webViewLink'
    ).execute()

    print(f"File copied successfully!")
    print(f"  New file name: {copied_file.get('name')}")
    print(f"  New file ID: {copied_file.get('id')}")
    print(f"  Link: {copied_file.get('webViewLink')}")

except Exception as e:
    print(f"An error occurred: {e}")
