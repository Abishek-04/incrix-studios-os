#!/bin/bash

# Script to strip TypeScript annotations from JavaScript files

echo "Stripping TypeScript annotations from src/ files..."

# Process all .jsx and .js files in src/
find src -type f \( -name "*.jsx" -o -name "*.js" \) | while read file; do
  echo "Processing: $file"

  # Backup original
  cp "$file" "$file.bak"

  # Multiple sed passes for different patterns

  # 1. Remove type imports and update import paths
  sed -i '' 's|from '\''\.\.\/types'\''|from '\''@/types'\''|g' "$file"
  sed -i '' 's|from '\''\.\/types'\''|from '\''@/types'\''|g' "$file"
  sed -i '' 's|from '\''\.\.\/components\/|from '\''@/components/|g' "$file"
  sed -i '' 's|from '\''\.\/components\/|from '\''@/components/|g' "$file"
  sed -i '' 's|from '\''\.\.\/services\/|from '\''@/services/|g' "$file"
  sed -i '' 's|from '\''\.\/services\/|from '\''@/services/|g' "$file"

  # 2. Remove interface and type definitions
  sed -i '' '/^interface [A-Z]/d' "$file"
  sed -i '' '/^export interface /d' "$file"
  sed -i '' '/^export type /d' "$file"
  sed -i '' '/^type [A-Z]/d' "$file"

  # 3. Remove React.FC<Props> patterns
  sed -i '' 's/: React\.FC<[^>]*>//' "$file"
  sed -i '' 's/React\.FC<[^>]*>/React.FC/g' "$file"

  # 4. Remove generic type parameters from hooks
  sed -i '' 's/useState<[^>]*>(/useState(/g' "$file"
  sed -i '' 's/useMemo<[^>]*>(/useMemo(/g' "$file"
  sed -i '' 's/useCallback<[^>]*>(/useCallback(/g' "$file"
  sed -i '' 's/useRef<[^>]*>(/useRef(/g' "$file"
  sed -i '' 's/useEffect<[^>]*>(/useEffect(/g' "$file"

  # 5. Remove type annotations from variables (simple pattern)
  sed -i '' 's/const \([a-zA-Z0-9_]*\): [A-Z][a-zA-Z0-9<>|&\[\]]*\[\] =/const \1 =/g' "$file"
  sed -i '' 's/const \([a-zA-Z0-9_]*\): [A-Z][a-zA-Z0-9<>|&\[\]]* =/const \1 =/g' "$file"
  sed -i '' 's/let \([a-zA-Z0-9_]*\): [A-Z][a-zA-Z0-9<>|&\[\]]*\[\] =/let \1 =/g' "$file"
  sed -i '' 's/let \([a-zA-Z0-9_]*\): [A-Z][a-zA-Z0-9<>|&\[\]]* =/let \1 =/g' "$file"

  # 6. Remove (e: any) patterns in event handlers
  sed -i '' 's/(e: any)/(e)/g' "$file"
  sed -i '' 's/(event: any)/(event)/g' "$file"

  # Clean up backup
  rm "$file.bak"
done

echo "Type stripping complete!"
