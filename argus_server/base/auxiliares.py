from datetime import datetime, timedelta
from astropy.coordinates import SkyCoord
import re
import math

def _check_units(ra, dec):
    # Pattern to match: any letter (a-z, A-Z) or "°"
    # Default unit is degrees, so if no unit, then is assumed as degs. 
    pattern = r'[a-zA-Z°]'
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

def get_sky_coordinates(latitude, longitude):
    """
    Calculate the declination and right ascension of the sky directly above the given latitude and longitude.
    """
    utc_now = datetime.utcnow()
    
    # Declination is simply the latitude
    dec = latitude

    # RA is the LST
    ra = get_lst(longitude, utc_now)

    # Convert RA from degrees to hours (1h = 15°)
    ra_in_hours = ra / 15.0

    return ra_in_hours, dec

if __name__ == '__main__':
#     latitude = float(input("Enter your latitude (degrees, + for North, - for South): "))
#     longitude = float(input("Enter your longitude (degrees, + for East, - for West): "))

    latitude = -23.550520
    longitude = -46.633308

    ra, dec = get_sky_coordinates(latitude, longitude)
    print(convert_coord_to_degrees(f"{ra:.2f}h", f"{dec:.2f}"))
    
    print(f"Right Ascension (RA): {ra:.2f} hours")
    print(f"Declination (Dec): {dec:.2f} degrees")