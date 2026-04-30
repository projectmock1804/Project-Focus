import requests, sys, json
from pathlib import Path

token = sys.argv[1]
owner = 'projectmock1804'
repo = 'project-focus'
tag = 'v1.0.9'
exe_path = r'C:\Users\Min\Project Focus\dist-electron\Project-Focus-Setup.exe'

headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Python/Requests'
}

print(f"Deploying {tag}...")

response = requests.get(f'https://api.github.com/repos/{owner}/{repo}/releases/tags/{tag}', headers=headers)

if response.status_code == 200:
    release_id = response.json()['id']
    for asset in response.json()['assets']:
        if asset['name'] == 'Project-Focus-Setup.exe':
            requests.delete(f'https://api.github.com/repos/{owner}/{repo}/releases/assets/{asset["id"]}', headers=headers)
    print(f"Updated existing release")
elif response.status_code == 404:
    body = """## Project Focus v1.0.9

**Improvement**: Electron app now shows Dashboard directly (not landing page)
- If logged in: Dashboard appears immediately
- If not logged in: Login screen appears
- Landing page only shown in web browser

**Previous fixes still included**:
- Module hoisting restoration (22 missing dependencies)
- Single-instance lock
- Process cleanup on install"""
    r = requests.post(f'https://api.github.com/repos/{owner}/{repo}/releases',
        headers=headers,
        json={'tag_name': tag, 'name': f'Project Focus {tag}', 'body': body, 'draft': False, 'prerelease': False})
    if r.status_code == 201:
        release_id = r.json()['id']
        print(f"Created release {tag}")
    else:
        print(f"Failed: {r.status_code} {r.text}")
        sys.exit(1)
else:
    print(f"Error: {response.status_code}")
    sys.exit(1)

exe_file = Path(exe_path)
print(f"Uploading {exe_file.stat().st_size / 1024 / 1024:.1f} MB...")
with open(exe_path, 'rb') as f:
    r = requests.post(
        f'https://uploads.github.com/repos/{owner}/{repo}/releases/{release_id}/assets',
        headers={**headers, 'Content-Type': 'application/octet-stream'},
        params={'name': 'Project-Focus-Setup.exe'}, data=f)

if r.status_code in [200, 201]:
    print(f"SUCCESS! Download: {r.json()['browser_download_url']}")
else:
    print(f"Upload failed: {r.status_code}")
    sys.exit(1)
