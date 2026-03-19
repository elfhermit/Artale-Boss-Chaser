import json
import re

local_json_path = r"d:\GitHub\AIGen\Artale-Boss-Chaser\docs\bosses\bosses.json"
local_js_path = r"d:\GitHub\AIGen\Artale-Boss-Chaser\docs\js\data\bosses.js"
ref_js_path = r"d:\GitHub\AIGen\Artale-Boss-Chaser\tmp_ref_repo\data.js"

# Read ref js
with open(ref_js_path, "r", encoding="utf-8") as f:
    ref_content = f.read()

# Parse ref js BOSS_DATA object
# Use a custom regex to grab key and its dictionary
ref_bosses = {}
pattern = re.compile(r'"?([^"]+)"?:\s*\{\s*min:\s*(\d+),\s*max:\s*(\d+),\s*maps:\s*(\[[^\]]+\]),\s*color:\s*"([^"]+)",\s*(?:hasMapSelect:\s*(true|false),\s*)?image:\s*"([^"]+)"\s*\}')

for match in pattern.finditer(ref_content):
    name = match.group(1).strip()
    maps_str = match.group(4)
    # clean maps string
    maps = [m.strip().strip('"').strip("'") for m in maps_str.strip('[]').split(',')]
    color = match.group(5)
    image = match.group(7)
    
    # Normalizing names to match local names
    name_map = {
        "雪山女巫": "雪山魔女",
        "自動警備": "自動警備系統",
        "迪特和洛伊": "迪特和洛依",
        "海怒斯": ["海怒斯(左)", "海怒斯(右)"]
    }
    
    # Some bosses map to multiple names or slightly different names
    if name in name_map:
        mapped = name_map[name]
        if isinstance(mapped, list):
            for m in mapped:
                ref_bosses[m] = {"maps": maps, "color": color, "image": image}
        else:
            ref_bosses[mapped] = {"maps": maps, "color": color, "image": image}
    else:
        ref_bosses[name] = {"maps": maps, "color": color, "image": image}

# Read local json
with open(local_json_path, "r", encoding="utf-8") as f:
    local_bosses = json.load(f)

for boss in local_bosses:
    name = boss["name"]
    if name in ref_bosses:
        boss["maps"] = ref_bosses[name]["maps"]
        boss["color"] = ref_bosses[name]["color"]
        # boss["image"] = ref_bosses[name]["image"]  # Keep local placeholder for now? The reference uses images/*.gif. Let's adapt it.
        # Actually user said "更新 boss data 資訊", so including map & image is good. Let's use it.
        boss["image"] = ref_bosses[name]["image"].replace("images/", "")
    else:
        # Provide defaults for missing ones
        boss["maps"] = ["未知地圖"]
        boss["color"] = "#808080" # default gray
        boss["image"] = "placeholder.svg"

# Write backed modified local json
with open(local_json_path, "w", encoding="utf-8") as f:
    json.dump(local_bosses, f, ensure_ascii=False, indent=2)

# Also generate js object
js_content = "(\nfunction () {\n    window.App.Data.Bosses = [\n"
for i, b in enumerate(local_bosses):
    js_content += f"        {json.dumps(b, ensure_ascii=False)}"
    if i < len(local_bosses) - 1:
        js_content += ",\n"
    else:
        js_content += "\n"
js_content += "    ];\n})();\n"

with open(local_js_path, "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"Updated {len(local_bosses)} bosses. Done.")
