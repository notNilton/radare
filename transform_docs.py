import re
import os

def transform(content, status_header, task_status, is_audit=False):
    # Remove any existing status header line to avoid duplicates
    lines = content.split('\n')
    filtered_lines = []
    for line in lines:
        if not line.strip().startswith('> **Status:'):
            filtered_lines.append(line)
    
    content = '\n'.join(filtered_lines)
    
    # Re-process
    lines = content.split('\n')
    new_lines = []
    in_code_block = False
    h1_found = False
    
    for line in lines:
        # Toggle code block state
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
            new_lines.append(line)
            continue
            
        if not in_code_block:
            # Match bullet points or numbered lists
            # Exclude already transformed items
            match_list = re.match(r'^(\s*)([-*]|\d+\.) (?!\[[ x]\])(.*)', line)
            
            if match_list:
                indent = match_list.group(1)
                text = match_list.group(3)
                
                # Special handling for 07-SYSTEM-AUDIT.md
                if is_audit and "Solução" in text:
                    text = text.replace("Solução", "Plano de Ação")
                
                new_lines.append(f'{indent}- {task_status} {text}')
                continue
            
            # Check for H1 and add status header
            if line.startswith('# ') and not h1_found:
                new_lines.append(line)
                new_lines.append(f'\n{status_header}')
                h1_found = True
                continue
        
        new_lines.append(line)
    
    return '\n'.join(new_lines)

files_config = [
    ("01-PHASE-1-ARCHITECTURE.md", "> **Status: [x] Implementada**", "[x]", False),
    ("02-PHASE-2-EXPANSION.md", "> **Status: [x] Implementada**", "[x]", False),
    ("03-PHASE-3-RELIABILITY.md", "> **Status: [x] Implementada**", "[x]", False),
    ("04-PHASE-4-INTELLIGENCE.md", "> **Status: [ ] Não Implementada**", "[ ]", False),
    ("05-PHASE-5-CONNECTIVITY.md", "> **Status: [ ] Não Implementada**", "[ ]", False),
    ("06-PHASE-6-MULTI-TENANT.md", "> **Status: [ ] Não Implementada**", "[ ]", False),
    ("07-SYSTEM-AUDIT.md", "> **Status: [ ] Em Aberto**", "[ ]", True),
]

base_path = "/var/home/notNilton/Workspace/nilbyte-studios/radare/docs/planning"

for filename, status_header, task_status, is_audit in files_config:
    file_path = os.path.join(base_path, filename)
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        transformed_content = transform(content, status_header, task_status, is_audit)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(transformed_content)
        print(f"Processed {filename}")
    else:
        print(f"File {filename} not found")
