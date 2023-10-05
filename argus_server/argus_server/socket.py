import socketio
from django.contrib.sessions.models import Session
from django.contrib.auth import get_user_model

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
def disconnect(sid):
    print('Disconnected:', sid)
