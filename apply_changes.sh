#!/bin/bash

# A script to process a markdown file, find sections for specific file paths or
# bash commands, and either write content to files or execute the commands.

# --- Configuration ---
HEADER_PREFIX="### "
# Using single quotes is more robust for defining a string containing backticks.
CODE_FENCE='```'

# --- Main Script Logic ---

# 1. Validate Input
# -----------------------------------------------------------------------------
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_markdown_file>"
    echo "Example: $0 work_breakdown/tasks/a.md"
    exit 1
fi

INPUT_FILE="$1"

if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file not found at '$INPUT_FILE'"
    exit 1
fi

echo "Processing file: $INPUT_FILE"
echo "-------------------------------------"

# 2. Initialize State
# -----------------------------------------------------------------------------
# 'search_header': Looking for a '### ...' line.
# 'search_code': Found a header, now looking for a code block start.
# 'in_code': Inside a code block, accumulating content.
STATE="search_header"
BLOCK_TYPE="" # Will be 'file' or 'bash'
CURRENT_SECTION_TITLE=""
CURRENT_CONTENT=""

# 3. Process the file line by line
# -----------------------------------------------------------------------------
while IFS= read -r line || [[ -n "$line" ]]; do
    case "$STATE" in
        "search_header")
            if [[ "$line" == "$HEADER_PREFIX"* ]]; then
                # Extract the title (which can be a file path or a description)
                CURRENT_SECTION_TITLE="${line#$HEADER_PREFIX}"
                echo "Found section: $CURRENT_SECTION_TITLE"
                STATE="search_code"
            fi
            ;;

        "search_code")
            # Check for a bash code block
            if [[ "$line" == "${CODE_FENCE}bash"* ]]; then
                BLOCK_TYPE="bash"
                echo "  -> Found bash block. Will execute content."
                CURRENT_CONTENT="" # Reset content
                STATE="in_code"
            # Check for any other type of code block
            elif [[ "$line" == "$CODE_FENCE"* ]]; then
                BLOCK_TYPE="file"
                echo "  -> Found file block. Will write to: $CURRENT_SECTION_TITLE"
                CURRENT_CONTENT="" # Reset content
                STATE="in_code"
            fi
            ;;

        "in_code")
            # Is this the end of the code block?
            if [[ "$line" == "$CODE_FENCE" ]]; then
                # --- This is the core action fork ---
                if [[ "$BLOCK_TYPE" == "bash" ]]; then
                    # --- EXECUTE BASH COMMANDS ---
                    echo "  -> Executing captured commands..."
                    # Execute the content in a subshell for safety.
                    # The 'bash -e' command ensures the subshell exits immediately if a command fails.
                    bash -e <<< "$CURRENT_CONTENT"
                    EXECUTION_STATUS=$?
                    if [ $EXECUTION_STATUS -eq 0 ]; then
                        echo "  -> Bash execution successful."
                    else
                        echo "  -> ERROR: Bash execution failed with status $EXECUTION_STATUS."
                    fi

                elif [[ "$BLOCK_TYPE" == "file" ]]; then
                    # --- WRITE TO FILE ---
                    DIR_NAME=$(dirname "$CURRENT_SECTION_TITLE")
                    mkdir -p "$DIR_NAME"
                    printf "%s" "$CURRENT_CONTENT" > "$CURRENT_SECTION_TITLE"
                    echo "  -> Wrote content to $CURRENT_SECTION_TITLE"
                fi
                
                echo # Add a blank line for readability
                # Reset state to look for the next section
                STATE="search_header"
                BLOCK_TYPE=""

            else
                # Still inside the code block. Append the line to our content.
                if [ -z "$CURRENT_CONTENT" ]; then
                    CURRENT_CONTENT="$line"
                else
                    CURRENT_CONTENT="$CURRENT_CONTENT"$'\n'"$line"
                fi
            fi
            ;;
    esac
done < "$INPUT_FILE"

echo "-------------------------------------"
echo "Processing complete."