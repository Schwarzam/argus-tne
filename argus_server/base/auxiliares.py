from datetime import datetime, timedelta
from astropy.coordinates import SkyCoord
import re
import pytz
import ephem

def _check_units(ra, dec):
    # Pattern to match: any letter (a-z, A-Z), "°", "h"
    pattern = r'[a-zA-Z°h]'
    
    def check(input_string):
        # re.search returns a match object if the pattern is found, None otherwise
        if re.search(pattern, input_string):
            return True
        else:
            return False
    
    if not check(ra):
        ra += 'h'  # default to hours for RA
    if not check(dec):
        dec += '°'  # default to degrees for Dec
    
    return ra, dec

def convert_coord_to_degrees(ra, dec):
    """
    Convert the coordinate to degrees.
    This should be called before any specific function that requires coordinates.
    """
    ra, dec = _check_units(ra, dec)

    # Create a SkyCoord object
    c = SkyCoord(ra, dec)

    # Return RA and Dec in degrees
    return c.ra.deg, c.dec.deg

def get_lst(longitude, utc_now):
    """
    Calculate the Local Sidereal Time (LST) based on the current UTC time and longitude.
    """
    # J2000: epoch of January 1, 2000, 12h TT
    j2000 = datetime(2000, 1, 1, 12, 0)
    days_since_j2000 = (utc_now - j2000).total_seconds() / 86400.0

    # Greenwich Mean Sidereal Time (GMST) at 0h UT
    gmst_at_0h = 280.46061837 + 360.98564736629 * days_since_j2000

    # Convert GMST to range [0, 360]
    gmst_at_0h %= 360

    # GMST now
    gmst_now = gmst_at_0h + 360.98564736629 * (utc_now.hour / 24.0)
    
    # Convert GMST to range [0, 360]
    gmst_now %= 360

    # Local Sidereal Time (LST)
    lst = gmst_now + longitude

    # Convert LST to range [0, 360]
    lst %= 360

    return lst

def get_abovesky_coordinates(latitude, longitude, utctime = datetime.utcnow()):
    """
    Calculate the declination and right ascension of the sky directly above the given latitude and longitude using ephem.
    """
    observer = ephem.Observer()
    observer.lat = str(latitude)
    observer.lon = str(longitude)
    
    observer.date = utctime  # current time
    #observer.date = ephem.now()  # current time
    
    # RA is just the sidereal time
    ra_radians = observer.sidereal_time()
    ra_hours = ra_radians * 12 / 3.141592653589793  # Convert from radians to hours
    
    # Dec is just the latitude
    dec_radians = observer.lat
    dec_degrees = dec_radians * 180 / 3.141592653589793  # Convert from radians to degrees

    return ra_hours, dec_degrees

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

    