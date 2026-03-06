#!/bin/bash

# Path to your Git repo
REPO_DIR="$sdcard/Elparadisogonzalo"

# Path to your Git objects files
GIT_PACK_DIR="$REPO_DIR/.git/objects"


# Path to your Git objects files
GIT_SYNC_DIR="$REPO_DIR/.git"


# Path to your public bucket folder
PUBLIC_BUCKET="/DOMAIN_URL/www/html/git-objects"

# Your domain URL pointing to the public folder
DOMAIN_URL="https://www.elparadisogonzalo.com/git-objects"

echo "Starting Git objects sync..."

# sync through all objects folders and files continousuously
for f in "$GIT_PACK_DIR"/*pack "$GIT_PACK_DIR"/*tmp "$GIT_PACK_DIR"/*idx; do
    filename=$(basename "$f")
    dest="$PUBLIC_BUCKET/$filename"

    # Copy all files
    if [ ! -f "$dest" ] || [ "$f" -f "$dest" ]; then
        echo "Copying $filename to public bucket..."
        cp "$f" "$PUBLIC_BUCKET/"
    fi
done

# Generate/Update URL list
URL_LIST="$PUBLIC_BUCKET/git_objects_urls.txt"
> "$URL_LIST"
for f in "$PUBLIC_BUCKET"/*{pack,idx,tmp}; do
    # include all files
    [ -f "$f" ] || continue
    filename=$(basename "$f")
    echo "$DOMAIN_URL/$filename" >> "$URL_LIST"
done

echo "Sync complete!"
echo "All Git objects and URL list are updated."
echo "URL list saved at $URL_LIST"
