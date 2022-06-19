from replit import web, db
import os
import json
import uuid
from urllib.parse import unquote
from pathlib import Path
from image import convert_to_webp
from htmlmin import minify as htmlmin
from rcssmin import cssmin
from jsmin import jsmin
from flask import (
  Flask,
  send_from_directory,
  render_template,
  abort,
  request,
)

non_webp_images = (
  'png',
  'jpg',
  'jpeg',
)

users = web.UserStore()

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.static_url_path = "/static"
ratelimit = web.per_user_ratelimit(
  max_requests=15,
  period=10,
  login_res=json.dumps({"error": "Not signed in"}),
  get_ratelimited_res=(
      lambda time_left: json.dumps(
          {"error": f"Wait {time_left:.2f} sec before trying again."}
      )
  ),
)
permitted = (
  'turnip123',
  'JonahKC',
  'SucculentCatus',
)
always_allowed = (
  '/static/styles/style.css',
  '/static/styles/contextMenu.css',
  '/static/styles/login.css',
  '/static/scripts/theme.js',
  '/static/scripts/contextMenu.js',
  '/static/scripts/login.js',
)

@app.before_request
def before_request():
  if not web.auth.is_authenticated and not request.path in always_allowed:
      return render_template('login.html')
  elif web.auth.is_authenticated and not web.auth.name in permitted:
    abort(403, 'You are not permitted to access this software')

@app.after_request
def after_request(response):
  minifiers = {
    'text/html': ('html', htmlmin),
    'text/css': ('css', cssmin),
    'text/javascript': ('js', jsmin),
    'application/javascript': ('js', jsmin),
    'application/x-javascript': ('js', jsmin),
  }
  minify_data = minifiers.get(response.mimetype, None)
  if minify_data:
    minify = minify_data[1]
    response.direct_passthrough = False
    response.set_data(minify(response.get_data(True)))
    return response
  else:
    return response

@app.route('/')
def index():
  return render_template('index.html')

@app.route('/note/<note_name>')
def view_note(note_name):
  filepath = f'./notes/{web.auth.name}.json'
  if os.path.exists(filepath):
    note_name = unquote(note_name)
    old_json = json.loads(Path(filepath).read_text('utf-8'))
    if note_name in old_json:
      return render_template('note.html', 
                             note_name=note_name,
                             note_content=old_json[note_name])
  abort(404, 'Note Not Found') 

@app.route('/download/<path:path>')
def download(path):
  return send_from_directory('uploads', path)

@app.route('/download/list')
def list_downloads():
  return db.to_primitive(users.current['images'])

@app.route('/note', methods=['POST'])
@web.params('name')
def create_note(name):
  name = unquote(name)
  filepath = f'./notes/{web.auth.name}.json'
  if os.path.exists(f'./notes/{web.auth.name}.json'):
    old_json = json.loads(Path(filepath).read_text('utf-8'))
  else:
    old_json = {}
  if not name in old_json:
    old_json[name] = ""
    
  Path(filepath).write_text(json.dumps(old_json), 'utf-8')
  return {'success': True}

@app.route('/note', methods=['DELETE'])
@web.params('name')
def delete_note(name):
  name = unquote(name)
  filepath = f'./notes/{web.auth.name}.json'
  if os.path.exists(f'./notes/{web.auth.name}.json'):
    old_json = json.loads(Path(filepath).read_text('utf-8'))
  else:
    old_json = {}
  if name in old_json:
    del old_json[name]
    
  Path(filepath).write_text(json.dumps(old_json), 'utf-8')
  return {'success': True}

@app.route('/note', methods=['PATCH'])
@web.params("name", "text")
def edit_note(name, text):
  filepath = f'./notes/{web.auth.name}.json'
  if os.path.exists(filepath):
    name = unquote(name)
    old_json = json.loads(Path(filepath).read_text('utf-8'))
    old_json[name] = text
    Path(filepath).write_text(json.dumps(old_json), 'utf-8')
    return {'success': True}
    
  abort(404, 'Note Not Found')

@app.route('/note/fetch', methods=['POST'])
@web.params("name")
def fetch_note(name):
  name = unquote(name)
  filepath = f'./notes/{web.auth.name}.json'
  if os.path.exists(filepath):
    old_json = json.loads(Path(filepath).read_text('utf-8'))
    if name in old_json:
      return '"' + old_json[name] + '"' if old_json[name] != '' else '\"\"'
  abort(404, 'Note Not Found') 

@app.route('/note/list')
def list_notes():
  filepath = f'./notes/{web.auth.name}.json'
  if os.path.exists(filepath):
    old_json = json.loads(Path(filepath).read_text('utf-8'))
    return json.dumps(list(old_json.keys()))
  return '[]'

@app.route('/upload', methods=['POST'])
def upload():
  f = request.files['file']
  image_uuid = uuid.uuid4().hex
  
  if not 'images' in users.current:
    users.current['images'] = []
    
  f.save(f'./uploads/{image_uuid}')
  
  image_path = Path(f'./uploads/{image_uuid}')
  
  if f.filename.rpartition('.')[2].lower() in non_webp_images:
    convert_to_webp(image_path, image_path)
  
  users.current['images'].append(image_uuid) 
  return '/'

if __name__ == '__main__':
  web.run(app)