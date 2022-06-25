from flask import request, send_from_directory
from replit import web
import os
import uuid

def init(app):
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