from datetime import datetime, timedelta
from astropy.coordinates import SkyCoord
from astropy import units as u
import os
import re
import pytz
import ephem
import time

import numpy as np
from skyfield.api import utc

from django.conf import settings
from skyfield.api import load

# Load ephemeris data
planets = load('de421.bsp')  # JPL's DE421 ephemeris for major solar system bodies

# Time scale for current time
ts = load.timescale()

# Dictionary of bodies in ephemeris files
bodies = {
    "Sun": planets['sun'],
    "Mercury": planets['mercury'],
    "Venus": planets['venus'],
    "Earth": planets['earth'],
    "Earth's Moon": planets['moon'],
    "Mars": planets['mars'],
    "Jupiter": planets['jupiter barycenter'],
    "Saturn": planets['saturn barycenter'],
    "Uranus": planets['uranus barycenter'],
    "Neptune": planets['neptune barycenter']
}

# Set up observer position (e.g., Earth's center)
observer = planets['earth']

def _check_units(ra, dec):
    # Pattern to match: any letter (a-z, A-Z) or "°"
    # Default unit is degrees, so if no unit, then is assumed as degs. 
    pattern = r'[a-zA-Z°]'
    ra = str(ra)
    dec = str(dec)
    
    def check(input_string):
        # re.search returns a match object if the pattern is found, None otherwise
        if re.search(pattern, input_string):
            return True
        else:
            return False
    
    if not check(ra):
        ra += '°'
    if not check(dec):
        dec += '°'
    
    return ra, dec

def convert_coord_to_degrees(ra, dec):
    """
    Convert the coordinate to degrees.
    This should be called before any specific function that requires coordinates.
    """
    ra, dec = _check_units(ra, dec)

    # Create a SkyCoord object
    c = SkyCoord(ra=ra, dec=dec)

    # Return RA and Dec in degrees
    return c.ra.deg, c.dec.deg


def get_body_coords(body_name, time_obs):
    """Returns the RA and Dec of a celestial body in degrees."""
    # Get current time
    current_time = ts.from_datetime(time_obs)
    
    # Get the body's astrometric position relative to the observer
    body = bodies[body_name]
    astrometric = observer.at(current_time).observe(body)
    ra, dec, distance = astrometric.radec()

    # Return RA and Dec in degrees
    return ra._degrees, dec.degrees 


def check_plan_ok(plan, now=False):
    """
    Check if a given observation plan is valid.

    Args:
        plan (ObservationPlan): The observation plan to check.
        now (bool, optional): Whether to set the start time to the current UTC time. Defaults to False.

    Returns:
        Tuple[bool, float, float, float]: A tuple containing the following values:
            - allowed (bool): Whether the observation is allowed.
            - distance (float): The distance between the target and the observer.
            - altitude (float): The altitude of the target.
            - azimuth (float): The azimuth of the target.
    """
    if now:
        plan.start_time = datetime.utcnow()
    
    if plan.object_name is not None:
        ra, dec = get_body_coords(plan.object_name, plan.start_time.replace(tzinfo=utc))
    else:
        ra = plan.ra
        dec = plan.dec
    
    allowed, distance, altitude, azimuth = check_coordinate_for_obs_angle(ra, dec, plan.start_time)
    return allowed, distance, altitude, azimuth

def get_alt_az(ra_deg, dec_deg, latitude=settings.LAT, longitude=settings.LON, utctime=datetime.utcnow()):
    """
    Calculate the altitude and azimuth for given RA and Dec using the provided observer.

    Parameters:
    - ra_deg: Right Ascension in degrees.
    - dec_deg: Declination in degrees.
    - observer: ephem.Observer object.
    
    Returns:
    - altitude: Altitude in degrees.
    - azimuth: Azimuth in degrees.
    """

    # Create a FixedBody for the given RA and Dec
    target = ephem.FixedBody()
    target._ra = np.deg2rad(ra_deg)  # Convert RA to radians
    target._dec = np.deg2rad(dec_deg)  # Convert Dec to radians

    # Create an observer
    observer = ephem.Observer()
    observer.lat = str(latitude)
    observer.lon = str(longitude)
    observer.date = utctime
    # Compute the object's position with respect to the observer
    target.compute(observer)

    # Return altitude and azimuth
    return float(target.alt) * 180 / np.pi, float(target.az) * 180 / np.pi


def get_abovesky_coordinates(latitude=settings.LAT, longitude=settings.LON, utctime=datetime.utcnow()):
    """
    Calculate the right ascension and declination coordinates of the observer.

    Parameters
    ----------
    latitude : float, optional
        The latitude of the observer in degrees. Default is the value in settings.LAT.
    longitude : float, optional
        The longitude of the observer in degrees. Default is the value in settings.LON.
    utctime : datetime.datetime, optional
        The UTC time of the observation. Default is the current UTC time.

    Returns
    -------
    ra_hours : float
        The right ascension coordinate of the observer in hours.
    dec_degrees : float
        The declination coordinate of the observer in degrees.
    """
    observer = ephem.Observer()
    observer.lat = str(latitude)
    observer.lon = str(longitude)
    
    observer.date = utctime
    
    ra_radians = observer.sidereal_time()
    ra_hours = ra_radians * 12 / np.pi  # Convert from radians to hours
    ra_degrees = ra_radians * 180 / np.pi  # Convert from hours to degrees
    
    dec_radians = observer.lat
    dec_degrees = dec_radians * 180 / np.pi  # Convert from radians to degrees
    return ra_degrees, dec_degrees

def list_to_string(lst):
    return ', '.join(map(str, lst))

def brasilia_to_utc(datetime_str):
    """
    Convert datetime in Brasilia time to UTC.
    
    Parameters:
    - datetime_str: Datetime in the format 'YYYY-MM-DD HH:MM:SS'
    
    Returns:
    - UTC datetime object
    """
    brasilia_tz = pytz.timezone('America/Sao_Paulo')
    
    # Convert the input string to a datetime object
    dt = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S')
    
    # Localize the datetime to Brasilia time
    localized_dt = brasilia_tz.localize(dt)
    
    # Convert to UTC
    utc_dt = localized_dt.astimezone(pytz.utc)
    
    return utc_dt

def utc_to_brasilia(datetime_str):
    """
    Convert datetime in UTC to Brasilia time.
    
    Parameters:
    - datetime_str: Datetime in the format 'YYYY-MM-DD HH:MM:SS'
    
    Returns:
    - Brasilia datetime object
    """
    utc_tz = pytz.utc
    brasilia_tz = pytz.timezone('America/Sao_Paulo')
    
    # Convert the input string to a datetime object
    dt = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S')
    
    # Localize the datetime to UTC
    localized_dt = utc_tz.localize(dt)
    
    # Convert to Brasilia time
    brasilia_dt = localized_dt.astimezone(brasilia_tz)
    
    return brasilia_dt

def angular_distance_astropy(ra1, dec1, ra2, dec2):
    """
    Calculate the angular distance between two points specified by RA and Dec using Astropy.
    
    Parameters:
    - ra1, dec1: RA and Dec of the first point in degrees.
    - ra2, dec2: RA and Dec of the second point in degrees.
    
    Returns:
    - Angular distance in degrees.
    """
    
    coord1 = SkyCoord(ra1*u.deg, dec1*u.deg, frame='icrs')
    coord2 = SkyCoord(ra2*u.deg, dec2*u.deg, frame='icrs')

    # Compute the angular separation
    sep = coord1.separation(coord2)

    return sep.deg

def check_coordinate_for_obs_angle(ra, dec, utctime=datetime.utcnow()):
    """
    Check if a given coordinate is within the maximum distance from the zenith.

    Parameters
    ----------
    ra : float
        Right ascension of the coordinate in degrees.
    dec : float
        Declination of the coordinate in degrees.
    utctime : datetime.datetime, optional
        UTC time of the observation. Default is the current UTC time.

    Returns
    -------
    bool
        True if the coordinate is within the maximum distance from the zenith, False otherwise.
    """
    above_ra, above_dec = get_abovesky_coordinates(utctime=utctime)
    above_ra, above_dec = convert_coord_to_degrees(above_ra, above_dec)
    
    ra, dec = convert_coord_to_degrees(ra, dec)
    
    distance = angular_distance_astropy(ra, dec, above_ra, above_dec)
    altitude, azimuth = get_alt_az(ra, dec, utctime=utctime)
    
    if altitude < settings.MIN_ZENITH or altitude > settings.MAX_ZENITH:
        return False, distance, altitude, azimuth
    if azimuth > settings.MAX_AZIMUTH or azimuth < settings.MIN_AZIMUTH:
        return False, distance, altitude, azimuth
    
    if distance >= settings.MAX_DISTANCE_FROM_ZENITH:
        return False, distance, altitude, azimuth
    return True, distance, altitude, azimuth

def files_in_directory(directory):
    """
    Returns a list of file names in the specified directory.

    Args:
        directory (str): The path of the directory to search for files.

    Returns:
        list: A list of file names in the specified directory.
    """
    return [name for name in os.listdir(directory) if os.path.isfile(os.path.join(directory, name))]

def modificar_data_arquivo(arquivo, data):
    # A data é convertida para um timestamp
    timestamp = time.mktime(data.timetuple())

    # Modificar data de acesso e data de modificação
    os.utime(arquivo, (timestamp, timestamp))