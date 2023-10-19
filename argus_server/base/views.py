from datetime import datetime
from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response
from django.contrib.auth import get_user_model

from base.executeobs import create_instructions_from_plan
from .models import Reservation, Telescope
    
from .decorators import require_keys
from django.conf import settings

import os

## auxiliares
from .auxiliares import brasilia_to_utc, check_coordinate_for_obs_angle, check_plan_ok, get_abovesky_coordinates, convert_coord_to_degrees, get_alt_az, list_to_string, utc_to_brasilia

## models
from .models import ObservationPlan

import base.backgroundtask ## Just to start the background task is running

@api_view(['GET'])
#@permission_classes([IsAuthenticated])
def protected_view(request):
    return Response({"message": "This is a protected view."})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_info(request):
    info = {}
    info['LAT'] = settings.LAT
    info['LON'] = settings.LON
    info['MAX_DISTANCE_FROM_ZENITH'] = settings.MAX_DISTANCE_FROM_ZENITH
    info['FILTROS'] = settings.FILTROS
    info['TIPOS_FRAME'] = settings.TIPOS_FRAME
    return Response(info)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_keys('ra', 'dec', 'date', 'filters', 'framemode', 'exptime')
def add_coordinate_to_plan(request):
    try:
        date = request.data['date'] 
        start_date = datetime.strptime(date, '%Y-%m-%dT%H:%M')
    except: 
        return Response({"message": "Invalid date format. Must be ISO 8601."})
    
    name = None
    if 'name' in request.data:
        name = request.data['name']
    
    ra = request.data['ra']
    dec = request.data['dec']
    
    filters = list_to_string(request.data['filters'])
    framemode = request.data['framemode']
    date = request.data['date']
    exptime = request.data['exptime']
  
    utc_start_date = brasilia_to_utc(start_date.strftime('%Y-%m-%d %H:%M:%S'))
    status = check_coordinate_for_obs_angle(ra, dec, utc_start_date)
    
    allowed = status[0]
    distance = status[1]
    
    if not allowed:
        return Response({
                "status": "error",
                "message": f"Observation angle not allowed. Distance from zenith: {distance}."
            })
    
    ra, dec = convert_coord_to_degrees(ra, dec)
    
    #print("aqui", get_alt_az(ra, dec, utctime=utc_start_date))
    
    obs_plan = ObservationPlan(
        user = request.user,
        name = name,
        ra = ra,
        dec = dec,
        filters = filters,
        framemode = framemode,
        exptime = exptime,
        start_time = start_date,
    )
    obs_plan.save()
    
    return Response({
            "status": "success",
            "message": f"Observation added to plan.",
            "plan_id": obs_plan.id
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fetch_plans(request):
    ## Fetch plans from today only
    time = utc_to_brasilia(datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'))
    plans = ObservationPlan.objects.filter(user=request.user, start_time__date=time)
    # from argus_server.socket import sio
    # sio.emit('message', "aqui")
    return Response(plans.values())

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_keys('plan_id')
def delete_plan(request):
    plan_id = request.data['plan_id']
    plan = ObservationPlan.objects.get(id=plan_id, user = request.user)
    plan.delete()
    return Response({"status": "success", "message": "Plan deleted."})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def above_sky(request):
    ra, dec = get_abovesky_coordinates()
    return Response({"message": f"RA: {ra}, Dec: {dec}"})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_keys('plan_id')
def check_if_plan_ok(request):
    plan_id = request.data['plan_id']
    plan = ObservationPlan.objects.get(id=plan_id)
    
    now = False
    if 'now' in request.data:
        now = True
    allowed, distance, _, _ = check_plan_ok(plan, now)
    
    if not allowed:
        return Response({
                "status": "error",
                "message": f"Observation angle not allowed. Distance from zenith: {distance}."
            })
    
    return Response({
            "status": "success",
            "message": f"Observation angle allowed."
        })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_keys('user_email', 'start_time', 'end_time')
def reserve_time(request):
    if not request.user.is_staff:
        return Response({"message": "Only admins can reserve time."}, status=401)
    
    Users = get_user_model()
    target_user = Users.objects.get(email=request.data['user_email'])
    
    start_time = datetime.strptime(request.data['start_time'], '%Y-%m-%dT%H:%M')
    end_time = datetime.strptime(request.data['end_time'], '%Y-%m-%dT%H:%M')
    
    if end_time < start_time:
        return Response({"message": "End time must be after start time."}, status=400)
    
    if (end_time - start_time).total_seconds() > settings.TEMPO_MAXIMO*60*60:
        return Response({"message": "Time reserved must be 5 hours or less."}, status=400)
    
    reservation = Reservation(
        user = target_user,
        start_time = start_time,
        end_time = end_time
    )
    reservation.save()
    
    return Response({"message": "Time reserved."})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_reservations(request):
    if not request.user.is_staff:
        return Response({"message": "Only admins can get reservations."}, status=401)
    
    
    ## Get reservations from after now in date order
    reservations = Reservation.objects.filter(start_time__gte=datetime.utcnow()).order_by('start_time')

    reservs = []
    for reservation in reservations:
        reservs.append({
            "id": reservation.id,
            "user": reservation.user.email,
            "username": reservation.user.username,
            "start_time": reservation.start_time,
            "end_time": reservation.end_time,
        })
    
    return Response({"reservations": reservs})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_keys('reservation_id')
def delete_reservation(request):
    if not request.user.is_staff:
        return Response({"message": "Only admins can delete reservations."})
    
    reservation_id = request.data['reservation_id']
    reservation = Reservation.objects.get(id=reservation_id)
    reservation.delete()
    
    return Response({"message": "Reservation deleted."})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_users_emails(request):
    if not request.user.is_staff:
        return Response({"message": "Only admins can get all users emails."})
    
    Users = get_user_model()
    users = Users.objects.all()
    emails = [user.email for user in users]
    
    return Response({"emails": emails})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_user_reservation(request):
    ## Get reservations from after now
    reservations = Reservation.objects.filter(user=request.user, start_time__gte=datetime.utcnow())
    return Response({"reservations": reservations.values()})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_keys('plan_id')
def execute_plan(request):
    plan = ObservationPlan.objects.get(id=request.data['plan_id'])
    
    instructions = create_instructions_from_plan(plan.id)
    instruction_name = str(plan.id).zfill(8)
    
    instructions_path = os.path.join(settings.ORCHESTRATE_FOLDER, instruction_name + ".txt")
    with open(instructions_path, 'w') as f:
        f.write(instructions)
        
    # TODO: Executar lógica backgoundtask.py
    """
    Verificar se o telescópio está livre.....
    """
    from django.db import transaction
    with transaction.atomic():
        try: telescope = Telescope.objects.filter(name=settings.DB_NAME).select_for_update(nowait=True)
        except: return Response({"status": "error", "message": "Telescope is busy."})
    
    telescope.update(status='busy', operation=instructions)
    
    return Response({"status": "success", "message": "Plan executed."})

