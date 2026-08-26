import sys

file_path = '/home/shaman/GTD-MoveLog/resources/js/Pages/VerifikasiBerkas/components/ShipmentCard.tsx'

with open(file_path, 'rb') as f:
    raw = f.read()

bom = b'\xef\xbb\xbf'
has_bom = raw.startswith(bom)
content = raw[3:].decode('utf-8') if has_bom else raw.decode('utf-8')

old_block = (
    '            {/* Header: Kontrak / Shipper (Kiri) & Progress X/5 (Kanan) */}\n'
    '            <div className=
