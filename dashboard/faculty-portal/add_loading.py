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

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Add useEffect to import if missing
    if "useEffect" not in content and "useState" in content:
        content = content.replace('import { useState } from "react";', 'import { useState, useEffect } from "react";')
    elif "useState" not in content and "useEffect" not in content:
        content = content.replace('import {', 'import { useState, useEffect } from "react";\nimport {')
    elif "useState, useEffect" not in content and "useState" in content:
        content = content.replace("useState", "useState, useEffect")

    # Insert isLoading state
    component_match = re.search(r'export default function \w+\(\) \{', content)
    if component_match:
        insert_pos = component_match.end()
        loading_code = "\n  const [isLoading, setIsLoading] = useState(true);\n  useEffect(() => {\n    const t = setTimeout(() => setIsLoading(false), 500);\n    return () => clearTimeout(t);\n  }, []);\n"
        content = content[:insert_pos] + loading_code + content[insert_pos:]

    # Find the main return (
    # We look for return (\n    <div className="max-w-...
    # Actually just look for `return (` inside the default function
    
    parts = content.split("return (")
    # Usually there's only one main return in these simple page files, or if multiple, the last one is the component return.
    # We will split by the first return inside the component, but there might be helpers.
    
    # Let's find the `return (` that is indented by 2 or 4 spaces and followed by `<div`
    return_match = re.search(r'return \(\s*<div[^>]*>', content)
    if return_match:
        start_of_div = return_match.start()
        # Find the end of this div? Or just wrap the children of this div.
        # Actually it's simpler to wrap the whole div content if we can find its end, or just wrap inside it.
        # Let's just find `return (` and the first `<div className="max-w-[^"]*">`
        # and inject right after that div opens.
        
        div_match = re.search(r'(return \(\s*<div[^>]*>)', content)
        if div_match:
            wrapper_start = div_match.end()
            # find where this div closes? Just append `)}` before the last `</div>\n  );\n}`
            
            # Skeleton logic:
            skeleton = """
      {isLoading ? (
        <div className="space-y-6 mt-8 animate-pulse">
          <div className="h-10 bg-gray-100 rounded w-1/4"></div>
          <div className="h-64 bg-gray-100 rounded-xl"></div>
          <div className="h-32 bg-gray-100 rounded-xl"></div>
        </div>
      ) : (
        <>"""
            content = content[:wrapper_start] + skeleton + content[wrapper_start:]
            
            # Now close it before the last `</div>`
            last_div_idx = content.rfind("</div>")
            if last_div_idx != -1:
                content = content[:last_div_idx] + "        </>\n      )}\n    " + content[last_div_idx:]
            
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Processed {filepath}")

for f in files:
    process_file(f)
