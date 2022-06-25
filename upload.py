from flask import request, send_from_directory
from replit import web
import subprocess
import os
import uuid

def purge_unused_images():

  # Huge scary monster to get free space in repl, in megabytes
  # and then convert it to a percentage of total space from 0-1
  used_percentage = int(str(subprocess.Popen('du -sh ~/$REPL_SLUG',stdout=subprocess.PIPE, shell=True).communicate()[0].strip(), 'utf-8').split('\t')[0][:-1]) / 1024
  
  print("{}% of storage used".format(used_percentage*100))

  if used_percentage > 0.5:
    for root, dirs, files in os.walk('./uploads'):
      for file in files:
        if file.endswith('.webp'):
          for json_file in os.listdir('./notes'):
            if json_file.endswith('.json'):
              with open(f'./notes/{json_file}', 'r') as f:
                data = f.read()
                if file[:-5] in data:
                  continue
                else:
                  os.remove(f'./uploads/{json_file[:-5]}/{file}')
                  print(f'Removed {file}')
                  break

def init(app):
  purge_unused_images()
  
  def make_user_upload_folder():
    if not os.path.exists(f'./uploads/{web.auth.name}'):
      os.mkdir(f'./uploads/{web.auth.name}')
  
  def get_download(file):
    if os.path.exists(f'./uploads/{web.auth.name}'):
      return send_from_directory(f'./uploads/{web.auth.name}', f'{file}.webp', as_attachment=True)
    else:
      os.mkdir(f'./uploads/{web.auth.name}')
      return {'success': False, 'message': 'Image with UUID {} does not exist'.format(file)}
  
  @app.route('/image', methods=['POST'])
  def upload():
    f = request.files['file']
    image_uuid = uuid.uuid4().hex
    make_user_upload_folder()
    f.save(f'./uploads/{web.auth.name}/{image_uuid}.webp')
    return f'/image/{image_uuid}'

  @app.route('/image', methods=['DELETE'])
  @web.params('image_uuid')
  def delete(image_uuid):
    path = f'./uploads/{web.auth.name}/{image_uuid}.webp'
    if os.path.exists(path):
      os.remove(path)
      return {'success': True}
    return {'success': False, 'message': 'Image with UUID {} does not exist'.format(image_uuid)}
  
  @app.route('/image/<path:path>')
  def download(path):
    return get_download(path)