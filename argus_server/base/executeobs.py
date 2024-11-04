"""
SlewToRaDec 12h 30m 0s +30d 45m 45s or 12.50000h +30.75000d
TakeImage Int or Float exptime
WaitFor 
SetFilter
SetFrameMode
"""

import os
from base.models import ObservationPlan
from django.conf import settings

def convert_coordinates(ra_deg, dec_deg):
    """
    Converts Right Ascension (RA) and Declination (Dec) coordinates from decimal degrees to sexagesimal format.

    Parameters
    ----------
    ra_deg : float
        The Right Ascension coordinate in decimal degrees.
    dec_deg : float
        The Declination coordinate in decimal degrees.

    Returns
    -------
    tuple
        A tuple containing two strings. The first string is the formatted sexagesimal coordinates in the format
        "hh h mm m ss.sss s ±dd d mm m ss.sss s". The second string is a simplified version of the coordinates in the
        format "hh.hhhh h ±dd.dddd d".

    Examples
    --------
    >>> convert_coordinates(83.63308333, 22.0145)
    ('5h 34m 31.40s +22d 00m 52.20s', '5.57554h +22.01450d')
    """
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
    Generate a set of instructions to execute an observation plan.

    Parameters
    ----------
    plan_id : int
        The ID of the observation plan to generate instructions for.

    Returns
    -------
    str
        A string containing the instructions to execute the observation plan.

    Notes
    -----
    This function generates a set of instructions to execute an observation plan.
    The instructions are returned as a string and can be written to a file or sent
    directly to the telescope control software.

    Examples
    --------
    >>> instructions = create_instructions_from_plan(42)
    >>> print(instructions)
    SlewToRaDec   , 42.123456         ,
    SetFrameMode  , 1         ,
    WaitFor       , 10         ,
    SetFilter     , R         ,
    WaitFor       , 5         ,
    TakeImage     , 30         ,
    SetFilter     , G         ,
    WaitFor       , 5         ,
    TakeImage     , 30         ,
    SetFilter     , B         ,
    WaitFor       , 5         ,
    TakeImage     , 30         ,
    WaitFor       , 10         ,
    """
    
    # Get the plan
    plan = ObservationPlan.objects.filter(id=plan_id).first()
    instructions = ""
    
    if plan.object_name:
        instructions += f"SlewToObject  , {plan.object_name}       ,\n"
    else:
        coordinates = convert_coordinates(plan.ra, plan.dec)
        instructions += f"SlewToRaDec   , {coordinates[1]}         ,\n"
        
    frame_mode = plan.framemode.strip()
    instructions += f"SetFrameMode  , {frame_mode}         ,\n"
    
    instructions += f"WaitFor       , {settings.TEMPO_DESLIZE}         ,\n"
                     
    exptime = plan.exptime
    filtros = plan.filters.split(',')
    for filtro in filtros:
        instructions += f"SetFilter     , {filtro.strip()}         ,\n"
        instructions += f"WaitFor       , {settings.TEMPO_FILTRO}         ,\n"
        instructions += f"TakeImage     , {exptime}         ,\n"
    
    instructions += f"WaitFor       , {settings.TEMPO_FRAME}         ,\n"
    
    return instructions

def get_orchestrate_filename(plan_id):
    """
    Returns the name and path of the orchestration file for a given plan ID.

    Args:
        plan_id (int): The ID of the plan.

    Returns:
        tuple: A tuple containing the name and path of the orchestration file.
    """
    instruction_name = str(plan_id).zfill(8)
    instructions_path = os.path.join(settings.ORCHESTRATE_FOLDER, instruction_name + ".txt")
    
    return instruction_name, instructions_path