# myapp/urls.py

from django.urls import path
from .views import singup

urlpatterns = [
    path('singup/', singup, name='singup'),
]