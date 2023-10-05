from datetime import datetime
from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response

from .decorators import require_keys

## auxiliares
from .auxiliares import brasilia_to_utc, check_coordinate_for_obs_angle, get_abovesky_coordinates, convert_coord_to_degrees, get_alt_az

## models
from .models import ObservationPlan

@api_view(['GET'])
#@permission_classes([IsAuthenticated])
def protected_view(request):
    return Response({"message": "This is a protected view."})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_keys('ra', 'dec', 'start_time')
def add_coordinate_to_plan(request):
    try: start_date = datetime.fromisoformat(request.data['start_time'])
    except: return Response({"message": "Invalid date format. Must be ISO 8601."})
    
    name = None
    if 'name' in request.data:
        name = request.data['name']
    
    ra = request.data['ra']
    dec = request.data['dec']
    
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
        start_time = start_date,
    )
    obs_plan.save()
    
    return Response({
            "status": "success",
            "message": f"Observation added to plan."
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fetch_plans(request):
    ## Fetch plans from today only
    plans = ObservationPlan.objects.filter(user=request.user, start_time__date=datetime.now().date())
    # from argus_server.socket import sio
    # sio.emit('message', "aqui")
    return Response({"plans": plans.values()})

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
    
    if 'now' in request.data:
        plan.start_time = datetime.utcnow()
        
    status = check_coordinate_for_obs_angle(plan.ra, plan.dec, plan.start_time)
    
    allowed = status[0]
    distance = status[1]
    
    if not allowed:
        return Response({
                "status": "error",
                "message": f"Observation angle not allowed. Distance from zenith: {distance}."
            })
    
    return Response({
            "status": "success",
            "message": f"Observation angle allowed."
        })