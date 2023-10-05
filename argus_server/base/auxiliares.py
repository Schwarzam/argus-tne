from datetime import datetime, timedelta
from astropy.coordinates import SkyCoord
from astropy import units as u
import re
import pytz
import ephem

import numpy as np

from django.conf import settings

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


def execute_observation():
    """
    Execute an observation.
    TODO: implement this function.
    """
    pass

    

if __name__ == '__main__':
#     latitude = float(input("Enter your latitude (degrees, + for North, - for South): "))
#     longitude = float(input("Enter your longitude (degrees, + for East, - for West): "))

    latitude = -23.550520
    longitude = -46.633308

    # Example usage:
    brt_datetime_str = '2023-10-04 16:30:00'
    utc_datetime = brasilia_to_utc(brt_datetime_str)
    print(utc_datetime)
    
    ra, dec = get_abovesky_coordinates(latitude, longitude, utc_datetime)
    print(convert_coord_to_degrees(f"{ra}", f"{dec}"))
    
    print(f"Right Ascension (RA): {ra} hours")
    print(f"Declination (Dec): {dec} degrees")

    