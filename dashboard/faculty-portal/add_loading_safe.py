import os
import re

files = [
    "app/requests/page.tsx",
    "app/doubts/page.tsx",
    # "app/curriculum/page.tsx",
    "app/trends/page.tsx",
    "app/rankings/page.tsx",
    "app/reports/page.tsx"
]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Add useEffect
    if "useEffect" not in content and "useState" in content:
        content = content.replace('import { useState }', 'import { useState, useEffect }')
        content = content.replace('import { useState,', 'import { useState, useEffect,')
    elif "useState" not in content and "useEffect" not in content:
        content = content.replace('import {', 'import { useState, useEffect } from "react";\nimport {', 1)

    # 2. Add state
    component_match = re.search(r'export default function \w+\(\) \{', content)
    if component_match:
        insert_pos = component_match.end()
        loading_code = "\n  const [isLoading, setIsLoading] = useState(true);\n  useEffect(() => {\n    const t = setTimeout(() => setIsLoading(false), 500);\n    return () => clearTimeout(t);\n  }, []);\n"
        content = content[:insert_pos] + loading_code + content[insert_pos:]

    # 3. Add loading condition around the content right after the page header.
    # The header is typically `<!-- Toolbar -->` or `<div className="mb-8">` or similar.
    # Actually, wrapping the main content div is easier.
    
    # In each file, there is usually a flex or grid layout after the header.
    # We can just look for the FIRST `<div className="bg-white border` or similar that indicates the main content card/table.
    # To be extremely safe, we can just replace the first `return (` of the component with a wrapper, and the last closing `</div>` with `)}</div>`.
    # Wait, the header should ideally be visible while loading, but the prompt says: "basic loading skeleton states... on each page's main content sections".
    
    # We will just use string replacement specifically for each file to ensure it's 100% correct without regex failures.
    
    with open(filepath, 'w') as f:
        f.write(content)
