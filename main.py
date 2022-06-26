from replit import web
from urllib.parse import quote, unquote
import os
import json
import subprocess
import upload
from pathlib import Path
from htmlmin import minify as htmlmin
from rcssmin import cssmin
from jsmin import jsmin
from flask import (
  Flask,
  render_template,
  abort,
  request,
  redirect,
  send_file,
)

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
  'SucculentCactus'
)
always_allowed = (
  '/static/styles/style.css',
  '/static/styles/contextMenu.css',
  '/static/styles/login.css',
  '/static/scripts/theme.js',
  '/static/scripts/contextMenu.js',
  '/static/scripts/login.js',
  '/static/scripts/sw.js',
  '/static/manifest.json',
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
  return render_template('index.html', storage_used=str(round(int(str(subprocess.Popen('du -sh ~/$REPL_SLUG',stdout=subprocess.PIPE, shell=True).communicate()[0].strip(), 'utf-8').split('\t')[0][:-1])/1024*100, 2)))

@app.route('/sw.js')
def serviceworker():
  return send_file('./static/scripts/sw.js')

@app.route('/note/')
@app.route('/note')
def redirect_invalid_note():
  return redirect('/')

@app.route('/note/<note_name>')
def view_note(note_name):
  filepath = f'./notes/{web.auth.name}.json'
  if os.path.exists(filepath):
    try:
      old_json = json.loads(Path(filepath).read_text('utf-8'))
    except json.decoder.JSONDecodeError:
      old_json = {}
    if quote(note_name) in old_json:
      return render_template('note.html', 
                             note_name=unquote(note_name),
                             note_content=old_json[quote(note_name)])
  abort(404, 'Note Not Found') 

@app.route('/note', methods=['POST'])
@web.params('name')
def create_note(name):
  filepath = f'./notes/{web.auth.name}.json'
  if os.path.exists(f'./notes/{web.auth.name}.json'):
    try:
      old_json = json.loads(Path(filepath).read_text('utf-8'))
    except json.decoder.JSONDecodeError:
      old_json = {}
  else:
    old_json = {}
  if not name in old_json:
    old_json[name] = ""
    
  Path(filepath).write_text(json.dumps(old_json), 'utf-8')
  return {'success': True}

@app.route('/note/rename', methods=['PATCH'])
@web.params('name', 'new_name')
def rename_note(name, new_name):
  filepath = f'./notes/{web.auth.name}.json'
  if os.path.exists(f'./notes/{web.auth.name}.json'):
    try:
      old_json = json.loads(Path(filepath).read_text('utf-8'))
    except json.decoder.JSONDecodeError:
      old_json = {}
  else:
    old_json = {}
  if not name in old_json:
    abort(404, 'Note not found')

  old_json[new_name] = old_json[name]
  del old_json[name]

  Path(filepath).write_text(json.dumps(old_json), 'utf-8')
  return {'success': True}

@app.route('/note', methods=['DELETE'])
@web.params('name')
def delete_note(name):
  filepath = f'./notes/{web.auth.name}.json'
  if os.path.exists(f'./notes/{web.auth.name}.json'):
    try:
      old_json = json.loads(Path(filepath).read_text('utf-8'))
    except json.decoder.JSONDecodeError:
      old_json = {}
  else:
    old_json = {}
  if name in old_json:
    del old_json[name]
  else:
    abort(404, 'Note not found')
    
  Path(filepath).write_text(json.dumps(old_json), 'utf-8')
  return {'success': True}

@app.route('/note', methods=['PATCH'])
@web.params("name", "text")
def edit_note(name, text):
  filepath = f'./notes/{web.auth.name}.json'
  if os.path.exists(filepath):
    try:
      old_json = json.loads(Path(filepath).read_text('utf-8'))
    except json.decoder.JSONDecodeError:
      old_json = {}
    old_json[name] = text
    Path(filepath).write_text(json.dumps(old_json), 'utf-8')
    return {'success': True}
    
  abort(404, 'Note Not Found')

@app.route('/note/fetch', methods=['POST'])
@web.params("name")
def fetch_note(name):
  filepath = f'./notes/{web.auth.name}.json'
  if os.path.exists(filepath):
    try:
      old_json = json.loads(Path(filepath).read_text('utf-8'))
    except json.decoder.JSONDecodeError:
      old_json = {}
    if name in old_json:
      return '"' + old_json[name] + '"' if old_json[name] != '' else '\"\"'
  abort(404, 'Note Not Found') 

@app.route('/note/list')
def list_notes():
  filepath = f'./notes/{web.auth.name}.json'
  if os.path.exists(filepath):
    try:
      old_json = json.loads(Path(filepath).read_text('utf-8'))
    except json.decoder.JSONDecodeError:
      old_json = {}
    return json.dumps(list(old_json.keys()))
  return '[]'

upload.init(app)

if __name__ == '__main__':
  web.run(app)