#!/bin/bash

# Paths
REPO_DIR="/sdcard/Elparadisogonzalo"
GIT_PACK_DIR="$REPO_DIR/.git/objects"
GIT_SYNC_DIR="$REPO_DIR/.git"

# Your Ethereum address
ETH_ADDRESS="0x802ba6A112F4A7BBbC2d63c8EF4bC14DFCBe6245"

# Wallet and URL lists
ETH_WALLET="$REPO_DIR/eth_wallet"
TOKENS_LIST="$ETH_WALLET/git_objects_wallet.txt"
DOMAIN_URL="https://elparadisogonzalo.com/git_objects"

# Ensure directories exist
mkdir -p "$ETH_WALLET"
> "$TOKENS_LIST"

echo "Starting sync..."

# Include only existing files
shopt -s nullglob

# Send all compatible Git objects to wallet folder
for f in "$GIT_PACK_DIR"/*.pack "$GIT_PACK_DIR"/*.tmp "$GIT_PACK_DIR"/*.idx; do
    filename=$(basename "$f")
    dest="$ETH_WALLET/$filename"

    # Copy file if it doesn't exist or source is newer
    if [ ! -f "$dest" ] || [ "$f" -nt "$dest" ]; then
        echo "Sending token $filename to Ethereum address $ETH_ADDRESS..."
        cp "$f" "$dest"
    fi
done

# Generate/update wallet balance (list all synced files)
for f in "$ETH_WALLET"/*{pack,idx,tmp}; do
    [ -f "$f" ] || continue
    filename=$(basename "$f")
    echo "$DOMAIN_URL/$filename" >> "$TOKENS_LIST"
done

echo "Sync complete!"
echo "All Git objects and wallet list are updated."
echo "Tokens sent to $ETH_ADDRESS"
