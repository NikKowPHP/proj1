# Key Rotation Runbook

This document outlines the process for rotating the `APP_ENCRYPTION_KEY`.

**This process involves downtime or a maintenance window.**

## Process

1.  **Generate a New Key:**
    ```bash
    openssl rand -base64 32
    ```

2.  **Update Environment Variables:**
    -   Add a new environment variable `APP_ENCRYPTION_KEY_NEW` with the new key.
    -   The application will need to be modified to read both the old and new keys for decryption.

3.  **Run Migration Script:**
    -   A new migration script will be required to re-encrypt all data with the new key.
    -   The script will read data decrypted with the old key and re-encrypt it with the new key.

4.  **Finalize Rotation:**
    -   Once all data is re-encrypted, `APP_ENCRYPTION_KEY` can be updated with the new key's value.
    -   The `APP_ENCRYPTION_KEY_NEW` variable can be removed.