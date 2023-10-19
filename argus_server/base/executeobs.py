"""
SlewToRaDec 12h 30m 0s +30d 45m 45s or 12.50000h +30.75000d
TakeImage Int or Float exptime
WaitFor 
SetFilter
SetFrameMode
"""

from base.models import ObservationPlan
from django.conf import settings

def convert_coordinates(ra_deg, dec_deg):
    # Convert RA from degrees to hours
    ra_hours = ra_deg / 15.0
    ra_h = int(ra_hours)
    ra_m = int((ra_hours - ra_h) * 60)
    ra_s = (ra_hours - ra_h - ra_m/60) * 3600

    # Handle Dec
    dec_sign = '+' if dec_deg >= 0 else '-'
    dec_deg = abs(dec_deg)
    dec_d = int(dec_deg)
    dec_m = int((dec_deg - dec_d) * 60)
    dec_s = (dec_deg - dec_d - dec_m/60) * 3600

    formatted = f"{ra_h}h {ra_m}m {ra_s:.2f}s {dec_sign}{dec_d}d {dec_m}m {dec_s:.2f}s"
    simplified = f"{ra_hours:.5f}h {dec_sign}{dec_deg:.5f}d"

    return formatted, simplified


def create_instructions_from_plan(plan_id):
    """
    Write an observation to a txt file.
    """
    
    # Get the plan
    plan = ObservationPlan.objects.filter(id=plan_id).first()
    instructions = ""
    
    coordinates = convert_coordinates(plan.ra, plan.dec)
    instructions += f"SlewToRaDec   , {coordinates[1]}         ,\n"
    
    frame_mode = plan.framemode
    instructions += f"SetFrameMode  , {frame_mode}         ,\n"
    
    instructions += f"WaitFor       , {settings.TEMPO_DESLIZE}         ,\n"
    
    exptime = plan.exptime
    filtros = plan.filters.split(',')
    for filtro in filtros:
        instructions += f"SetFilter     , {filtro}         ,\n"
        instructions += f"WaitFor       , {settings.TEMPO_FILTRO}         ,\n"
        instructions += f"TakeImage     , {exptime}         ,\n"
    
    instructions += f"WaitFor       , {settings.TEMPO_FRAME}         ,\n"
    
    return instructions