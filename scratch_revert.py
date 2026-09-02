import re

files = [
    r'D:\project\praktek-dr-rme\components\staf\FormKunjungan.tsx',
    r'D:\project\praktek-dr-rme\components\dokter\TabRekamMedis.tsx'
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(r'(<div[^>]*className="[^"]*bg-\[\#FAF9F6\].*?)({\/\* Kontrol Navigasi.*?})', content, re.DOTALL | re.IGNORECASE)
    
    if match:
        block = match.group(1)
        
        block = block.replace('text-foreground', 'text-gray-900')
        block = block.replace('bg-card', 'bg-white')
        block = block.replace('border-border', 'border-gray-200')
        block = block.replace('text-muted-foreground', 'text-gray-500')
        block = block.replace('bg-muted', 'bg-gray-50')
        block = block.replace('hover:bg-muted/50', 'hover:bg-gray-50/50')
        block = block.replace('hover:bg-muted', 'hover:bg-gray-50')
        block = re.sub(r'\s*dark:text-blue-300', '', block)
        block = re.sub(r'\s*dark:text-red-300', '', block)
        block = re.sub(r'\s*dark:border-red-800', '', block)
        block = re.sub(r'\s*dark:text-sky-300', '', block)
        block = re.sub(r'\s*dark:text-amber-300', '', block)
        block = re.sub(r'\s*dark:border-amber-800', '', block)
        block = re.sub(r'\s*dark:border-amber-800/80', '', block)
        block = re.sub(r'\s*dark:border-blue-800', '', block)
        
        content = content[:match.start()] + block + content[match.end()-len(match.group(2)):]
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Updated", filepath)
    else:
        print("No match found in", filepath)
