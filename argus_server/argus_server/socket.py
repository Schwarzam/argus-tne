import socketio
from django.contrib.sessions.models import Session
from django.contrib.auth import get_user_model
from datetime import datetime
import json

from django.conf import settings
from base.models import Telescope
from base.auxiliares import brasilia_to_utc, check_coordinate_for_obs_angle

sio = socketio.Server(cors_allowed_origins="*")

@sio.event
def connect(sid, environ):
    # Extract sessionid from the cookies
    cookie = environ.get('HTTP_COOKIE')
    if not cookie:
        print(f"Cookie not found in request: {environ}")
        return False

    # Parse the cookie to get sessionid
    cookie_dict = {i.split('=')[0].strip(): i.split('=')[1].strip() for i in cookie.split(';')}
    session_key = cookie_dict.get('sessionid', None)

    if not session_key:
        print(f"Session key not found in cookie: {cookie}")
        return False

    # Get session and check if user is authenticated
    try:
        session = Session.objects.get(session_key=session_key)
        user_id = session.get_decoded().get('_auth_user_id')
        User = get_user_model()
        user = User.objects.get(id=user_id)

        if user.is_authenticated:
            print(f"Authenticated user {user.username} connected with SID: {sid}")
            return True
        else:
            print(f"User with SID {sid} not authenticated.")
            return False
    except (Session.DoesNotExist, User.DoesNotExist):
        print(f"User with SID {sid} not authenticated.")
        return False

@sio.event
def message(sid, data):
    print('message:', data)

@sio.event
def checkcoord(sid, data):
    try:
        ra = data['ra']
        dec = data['dec']
        status = check_coordinate_for_obs_angle(ra, dec)
        allowed = status[0]
        distance = status[1]
        sio.emit('coordchecked', {'allowed': allowed, 'distance': distance}, room=sid)
    except:
        sio.emit('coordcheckedondate', {'allowed': False, 'distance': 0}, room=sid)

@sio.event
def checkcoordondate(sid, data):
    try:
        ra = data['ra']
        dec = data['dec']
        date = data['date']
        date_obj = datetime.strptime(date, '%Y-%m-%dT%H:%M')
        utc_start_date = brasilia_to_utc(date_obj.strftime('%Y-%m-%d %H:%M:%S'))
        status = check_coordinate_for_obs_angle(ra, dec, utc_start_date)
        allowed = status[0]
        distance = status[1]
        sio.emit('coordcheckedondate', {'allowed': allowed, 'distance': distance}, room=sid)
    except:
        sio.emit('coordcheckedondate', {'allowed': False, 'distance': 0}, room=sid)

@sio.event
def check_telescope_status(sid, data):
    tel = Telescope.objects.filter(name=settings.DB_NAME).values().first()
    
    sio.emit('telescope_status', tel, room=sid)
    
@sio.event
def disconnect(sid):
    print('Disconnected:', sid)
