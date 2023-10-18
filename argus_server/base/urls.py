# myapp/urls.py

from django.urls import path
from .views import add_coordinate_to_plan, above_sky, fetch_plans, check_if_plan_ok, get_info, delete_plan

import base.views as views

urlpatterns = [
    path('appinfo/', get_info, name='get_info'),
    
    path('get_reservations/', views.get_reservations, name='get_reservations'),
    path('reserve_time/', views.reserve_time, name='reserve_time'),
    path('delete_reservation/', views.delete_reservation, name='delete_reservation'),
    path('get_all_users_emails/', views.get_all_users_emails, name='get_all_users_emails'),
    path('check_user_reservation/', views.check_user_reservation, name='check_user_reservation'),
    
    path('create_plan/', add_coordinate_to_plan, name='add_coordinate_to_plan'),
    path('delete_plan/', delete_plan, name='delete_plan'),
    path('above_sky/', above_sky, name='above_sky'),
    path('fetch_plans/', fetch_plans, name='fetch_plans'),
    path('check_if_plan_ok/', check_if_plan_ok, name='check_if_plan_ok'),
]