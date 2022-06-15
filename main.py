from replit import web, db
import os
import json
import uuid
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
  elif not web.auth.name in permitted:
    abort(403, 'You are not permitted to access this software')

@app.after_request
def after_request(response):
  minifiers = {
    'text/html': htmlmin,
    'text/css': cssmin,
    'text/javascript': jsmin,
    'application/x-javascript': jsmin,
  }
  minify = minifiers.get(response.mimetype, None)
  if minify:
    response.direct_passthrough = False
    response.set_data(minify(response.get_data(True)))
    return response
  else:
    return response

@app.route('/')
def index():
  return render_template('index.html')

@app.route('/download/<path:path>')
def download(path):
  return send_from_directory('uploads', path)

@app.route('/download/list')
def list_downloads():
  return db.to_primitive(users.current['images'])

@app.route('/note/create', methods=['POST'])
@web.params("name")
def create_note(name):
  if web.auth.name in os.listdir('./notes'):
    old_json = json.load(f'./notes/{web.auth.name}')
  else:
    Path(f'./notes/{web.auth.name}').write_text('{}', encoding='utf-8')
    old_json = json.load(f'./notes/{web.auth.name}')
  
  if not name in old_json:
    old_json[name] = ""

@app.route('/note/edit', methods=['PATCH'])
@web.params("name", "text")
def edit_note(name, text):
  if web.auth.name in os.listdir('./notes'):
    old_json = json.load(f'./notes/{web.auth.name}')
    if name in old_json:
      old_json[name] = text
      return
  abort(404, 'Note Not Found')

@app.route('/note/fetch', methods=['POST'])
@web.params("name")
def fetch_note(name):
  if web.auth.name in os.listdir('./notes'):
    old_json = json.load(f'./notes/{web.auth.name}')
    if name in old_json:
      return old_json[name]
  abort(404, 'Note Not Found') 

@app.route('/note/list', methods=['GET'])
def list_notes():
  if web.auth.name in os.listdir('./notes'):
    old_json = json.load(f'./notes/{web.auth.name}')
    return tuple(old_json.keys())
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