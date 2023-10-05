# myapp/urls.py

from django.urls import path
from .views import add_coordinate_to_plan, above_sky, fetch_plans, check_if_plan_ok

urlpatterns = [
    path('add_coordinate_to_plan/', add_coordinate_to_plan, name='add_coordinate_to_plan'),
    path('above_sky/', above_sky, name='above_sky'),
    path('fetch_plans/', fetch_plans, name='fetch_plans'),
    path('check_if_plan_ok/', check_if_plan_ok, name='check_if_plan_ok'),
]