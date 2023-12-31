"""
WSGI config for argus_server project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os
from socketio import Middleware
from .socket import sio

import eventlet
import eventlet.wsgi

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'argus_server.settings')

django_app = get_wsgi_application()
application = Middleware(sio, django_app)

eventlet.wsgi.server(eventlet.listen(('', 8000)), application)
