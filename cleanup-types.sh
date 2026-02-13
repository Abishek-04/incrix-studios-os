#!/bin/bash

# More aggressive TypeScript cleanup

echo "Performing aggressive TypeScript cleanup..."

find src -type f \( -name "*.jsx" -o -name "*.js" \) | while read file; do
  echo "Cleaning: $file"

  # Remove standalone lines with type annotations (interface remnants)
  sed -i '' '/^[[:space:]]*[a-zA-Z]*:[[:space:]]*([^)]*)[[:space:]]*=>/d' "$file"

  # Remove closing braces that are alone on a line after interface removal
  # (This is tricky, so we'll handle it manually after)

  # Remove parameter type annotations more aggressively
  sed -i '' 's/(e: React\.[A-Za-z]*)/((e)/g' "$file"
  sed -i '' 's/(event: React\.[A-Za-z]*)/((event)/g' "$file"
  sed -i '' 's/(e: [A-Z][a-zA-Z]*)/((e)/g' "$file"
  sed -i '' 's/(event: [A-Z][a-zA-Z]*)/((event)/g' "$file"
  sed -i '' 's/([a-zA-Z_][a-zA-Z0-9_]*: [A-Z][a-zA-Z0-9<>|&\[\]]*)/(\1/g' "$file"

  # Remove type-only imports
  sed -i '' '/import.*{.*User.*Role.*}.*from.*@\/types/d' "$file"
  sed -i '' '/import.*{.*Project.*}.*from.*@\/types/d' "$file"
  sed -i '' '/import.*{.*Channel.*}.*from.*@\/types/d' "$file"
  sed -i '' '/import.*{.*Notification.*}.*from.*@\/types/d' "$file"
  sed -i '' '/import.*type/d' "$file"

  # Fix double parentheses from parameter cleanup
  sed -i '' 's/((/((/g' "$file"

done

echo "Aggressive cleanup complete!"
