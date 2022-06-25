from flask import request, abort, send_file
from io import BytesIO
from PIL import Image
from replit import web
import subprocess
import os
import uuid

def purge_unused_images():

  # Huge scary monster to get free space in repl, in megabytes
  # and then convert it to a percentage of total space from 0-1
  used_percentage = int(str(subprocess.Popen('du -sh ~/$REPL_SLUG',stdout=subprocess.PIPE, shell=True).communicate()[0].strip(), 'utf-8').split('\t')[0][:-1]) / 1024
  
  print("{}% of storage used".format(used_percentage*100))

  if used_percentage > 0.1:
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

FORMAT_TABLE = {
  'jpg': ('JPEG', 'image/jpeg'),
  'png': ('PNG', 'image/png'),
  'webp': ('WEBP', 'image/webp'),
}

def init(app):
  global FORMAT_TABLE
  
  purge_unused_images()
  
  def make_user_upload_folder():
    if not os.path.exists(f'./uploads/{web.auth.name}'):
      os.mkdir(f'./uploads/{web.auth.name}')
  
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
    abort(404, 'Image with UUID {} does not exist'.format(image_uuid))
  
  @app.route('/image/<path:path>')
  def download(path):
    file_format = request.args.get('format')
    
    if file_format in (None, 'webp', 'png', 'jpg'):
      converted_image = BytesIO()
      
      Image.open(f'./uploads/{web.auth.name}/{path}.webp').save(
        converted_image, FORMAT_TABLE.get(
          format, ('WEBP', 'image/webp'))[0])
      converted_image.seek(0)
      
      converted_image.name = f'{path[:-5]}.{file_format}'
      return send_file(converted_image, mimetype=FORMAT_TABLE.get(file_format, ('WEBP', 'image/webp'))[1])
    else:
      abort(415, '{} is not an accepted image format')
  